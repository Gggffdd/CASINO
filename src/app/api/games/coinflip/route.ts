import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { coinflipResult, COINFLIP_MULTIPLIER } from '@/lib/games/ladder-tower'

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { betAmount, choice } = body

    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const amount = parseFloat(betAmount)
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bet' }, { status: 400 })
    if (parseFloat(user.balance.toString()) < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }
    if (choice !== 'heads' && choice !== 'tails') {
      return NextResponse.json({ error: 'Invalid choice' }, { status: 400 })
    }

    const result = coinflipResult()
    const won = result === choice
    const winAmount = won ? amount * COINFLIP_MULTIPLIER : 0

    const [updatedUser, bet] = await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          balance: won ? { increment: winAmount - amount } : { decrement: amount },
          totalWon: won ? { increment: winAmount } : undefined,
          totalLost: !won ? { increment: amount } : undefined,
        },
      }),
      prisma.bet.create({
        data: {
          userId: user.id,
          game: 'COINFLIP',
          betAmount: amount,
          winAmount: winAmount,
          multiplier: won ? COINFLIP_MULTIPLIER : 0,
          status: won ? 'WON' : 'LOST',
          gameData: { choice, result },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      choice,
      result,
      won,
      multiplier: COINFLIP_MULTIPLIER,
      winAmount,
      balance: updatedUser.balance.toString(),
    })
  } catch (error) {
    console.error('Coinflip error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
