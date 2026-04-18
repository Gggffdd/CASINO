import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { generateLadderRow, getLadderMultiplier, LADDER_DIFFICULTIES } from '@/lib/games/ladder-tower'

const activeLadderGames = new Map<number, {
  betId: string
  betAmount: number
  difficulty: string
  currentRow: number
  totalRows: number
  rows: { mines: boolean[] }[]
  status: 'playing' | 'won' | 'lost' | 'cashed_out'
}>()

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, betAmount, difficulty = 'medium', cellIndex } = body

    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (action === 'start') {
      const amount = parseFloat(betAmount)
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bet' }, { status: 400 })
      if (parseFloat(user.balance.toString()) < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
      const config = LADDER_DIFFICULTIES[difficulty] || LADDER_DIFFICULTIES.medium
      const totalRows = 8
      const rows = Array.from({ length: totalRows }, () => ({
        mines: generateLadderRow(config.cells, config.mines),
      }))
      const [updatedUser, bet] = await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: amount } } }),
        prisma.bet.create({
          data: { userId: user.id, game: 'LADDER', betAmount: amount, status: 'PENDING', gameData: { difficulty } },
        }),
      ])
      activeLadderGames.set(user.id, {
        betId: bet.id, betAmount: amount, difficulty,
        currentRow: 0, totalRows, rows, status: 'playing',
      })
      return NextResponse.json({
        success: true, betId: bet.id, totalRows, difficulty,
        config: { cells: config.cells, mines: config.mines },
        currentRow: 0, currentMultiplier: 1,
        nextMultiplier: getLadderMultiplier(difficulty, 0),
        balance: updatedUser.balance.toString(),
      })
    }

    if (action === 'step') {
      const game = activeLadderGames.get(user.id)
      if (!game || game.status !== 'playing') return NextResponse.json({ error: 'No active game' }, { status: 400 })
      const config = LADDER_DIFFICULTIES[game.difficulty]
      if (cellIndex < 0 || cellIndex >= config.cells) return NextResponse.json({ error: 'Invalid cell' }, { status: 400 })
      const row = game.rows[game.currentRow]
      const isMine = row.mines[cellIndex]
      if (isMine) {
        game.status = 'lost'
        activeLadderGames.delete(user.id)
        await prisma.$transaction([
          prisma.bet.update({ where: { id: game.betId }, data: { status: 'LOST' } }),
          prisma.user.update({ where: { id: user.id }, data: { totalLost: { increment: game.betAmount } } }),
        ])
        const fresh = await prisma.user.findUnique({ where: { id: user.id } })
        return NextResponse.json({ success: true, hit: true, isMine: true, revealedRow: row.mines, balance: fresh!.balance.toString() })
      }
      game.currentRow++
      const multiplier = getLadderMultiplier(game.difficulty, game.currentRow - 1)
      const nextMultiplier = getLadderMultiplier(game.difficulty, game.currentRow)
      const allDone = game.currentRow >= game.totalRows
      if (allDone) {
        game.status = 'won'
        activeLadderGames.delete(user.id)
        const winAmount = game.betAmount * multiplier
        const [updated] = await prisma.$transaction([
          prisma.user.update({ where: { id: user.id }, data: { balance: { increment: winAmount }, totalWon: { increment: winAmount } } }),
          prisma.bet.update({ where: { id: game.betId }, data: { status: 'WON', winAmount, multiplier } }),
        ])
        return NextResponse.json({ success: true, hit: false, allDone: true, multiplier, winAmount, balance: updated.balance.toString(), revealedRow: row.mines })
      }
      return NextResponse.json({ success: true, hit: false, cellIndex, currentRow: game.currentRow, multiplier, nextMultiplier, potentialWin: game.betAmount * multiplier, revealedRow: row.mines })
    }

    if (action === 'cashout') {
      const game = activeLadderGames.get(user.id)
      if (!game || game.status !== 'playing') return NextResponse.json({ error: 'No active game' }, { status: 400 })
      if (game.currentRow === 0) return NextResponse.json({ error: 'Must climb at least 1 row' }, { status: 400 })
      const multiplier = getLadderMultiplier(game.difficulty, game.currentRow - 1)
      const winAmount = game.betAmount * multiplier
      activeLadderGames.delete(user.id)
      const [updated] = await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { balance: { increment: winAmount }, totalWon: { increment: winAmount } } }),
        prisma.bet.update({ where: { id: game.betId }, data: { status: 'CASHOUT', winAmount, multiplier } }),
      ])
      return NextResponse.json({ success: true, multiplier, winAmount, balance: updated.balance.toString() })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Ladder error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
