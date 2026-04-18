import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { spinSlots, DOG_HOUSE_SYMBOLS, SUGAR_RUSH_SYMBOLS } from '@/lib/games/slots'

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { betAmount, game = 'dog' } = body
    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    const amount = parseFloat(betAmount)
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bet' }, { status: 400 })
    if (parseFloat(user.balance.toString()) < amount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const symbols = game === 'sugar' ? SUGAR_RUSH_SYMBOLS : DOG_HOUSE_SYMBOLS
    const gameType = game === 'sugar' ? 'SLOTS_SUGAR' : 'SLOTS_DOG'
    const result = spinSlots(symbols, amount)

    const netChange = result.winAmount - amount
    const [updatedUser, bet] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: { increment: netChange },
          totalWon: result.winAmount > 0 ? { increment: result.winAmount } : undefined,
          totalLost: result.winAmount === 0 ? { increment: amount } : undefined,
        },
      }),
      prisma.bet.create({
        data: {
          userId: user.id,
          game: gameType,
          betAmount: amount,
          winAmount: result.winAmount,
          multiplier: result.totalMultiplier,
          status: result.winAmount > 0 ? 'WON' : 'LOST',
          gameData: {
            grid: result.grid.map(col => col.map(s => s.id)),
            winLines: result.winLines.map(l => ({ lineIndex: l.lineIndex, count: l.count, multiplier: l.multiplier, symbol: l.symbol.id })),
            scatters: result.scatters,
          },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      grid: result.grid.map(col => col.map(s => ({ id: s.id, name: s.name, color: s.color, value: s.value }))),
      winLines: result.winLines.map(l => ({ lineIndex: l.lineIndex, positions: l.positions, symbol: l.symbol.id, count: l.count, multiplier: l.multiplier })),
      scatters: result.scatters,
      hasFreeSpin: result.hasFreeSpin,
      totalMultiplier: result.totalMultiplier,
      winAmount: result.winAmount,
      balance: updatedUser.balance.toString(),
    })
  } catch (error) {
    console.error('Slots error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
