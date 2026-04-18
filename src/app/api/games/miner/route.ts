import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import {
  generateMinerGrid,
  getMinerMultiplier,
  generateServerSeed,
  hashServerSeed,
  MINER_CONFIGS,
} from '@/lib/games/miner'
import { Decimal } from '@prisma/client/runtime/library'

// In-memory game state (in production, use Redis)
const activeMinerGames = new Map<number, {
  betId: string
  grid: boolean[]
  rows: number
  cols: number
  mines: number
  revealed: number[]
  serverSeed: string
  betAmount: number
}>()

// POST /api/games/miner - start game
export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { betAmount, difficulty = 'medium', action, cellIndex } = body

    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // === START NEW GAME ===
    if (action === 'start') {
      const amount = parseFloat(betAmount)
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bet' }, { status: 400 })
      if (new Decimal(user.balance).lt(amount)) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

      const config = MINER_CONFIGS[difficulty] || MINER_CONFIGS.medium
      const serverSeed = generateServerSeed()
      const grid = generateMinerGrid(config.rows, config.cols, config.mines, serverSeed)

      // Deduct balance and create bet
      const [updatedUser, bet] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
        }),
        prisma.bet.create({
          data: {
            userId: user.id,
            game: 'MINER',
            betAmount: amount,
            status: 'PENDING',
            gameData: { difficulty, serverSeedHash: hashServerSeed(serverSeed) },
          },
        }),
      ])

      activeMinerGames.set(user.id, {
        betId: bet.id,
        grid,
        rows: config.rows,
        cols: config.cols,
        mines: config.mines,
        revealed: [],
        serverSeed,
        betAmount: amount,
      })

      return NextResponse.json({
        success: true,
        betId: bet.id,
        rows: config.rows,
        cols: config.cols,
        mines: config.mines,
        balance: updatedUser.balance.toString(),
        serverSeedHash: hashServerSeed(serverSeed),
        currentMultiplier: getMinerMultiplier(config.rows * config.cols, config.mines, 0),
      })
    }

    // === REVEAL CELL ===
    if (action === 'reveal') {
      const game = activeMinerGames.get(user.id)
      if (!game) return NextResponse.json({ error: 'No active game' }, { status: 400 })

      if (game.revealed.includes(cellIndex)) {
        return NextResponse.json({ error: 'Cell already revealed' }, { status: 400 })
      }

      const isMine = game.grid[cellIndex]

      if (isMine) {
        // Lost - reveal full grid
        activeMinerGames.delete(user.id)
        const fullGrid = game.grid.map((isMine, idx) => ({
          index: idx,
          isMine,
          revealed: game.revealed.includes(idx) || idx === cellIndex,
        }))

        await prisma.$transaction([
          prisma.bet.update({
            where: { id: game.betId },
            data: {
              status: 'LOST',
              gameData: { difficulty: 'hit_mine', serverSeed: game.serverSeed },
            },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: { totalLost: { increment: game.betAmount } },
          }),
        ])

        const freshUser = await prisma.user.findUnique({ where: { id: user.id } })
        return NextResponse.json({
          success: true,
          hit: true,
          isMine: true,
          grid: fullGrid,
          serverSeed: game.serverSeed,
          balance: freshUser!.balance.toString(),
        })
      }

      // Safe cell
      game.revealed.push(cellIndex)
      const total = game.rows * game.cols
      const multiplier = getMinerMultiplier(total, game.mines, game.revealed.length)
      const nextMultiplier = getMinerMultiplier(total, game.mines, game.revealed.length + 1)
      const potentialWin = game.betAmount * multiplier

      // Check if all safe cells revealed
      const allSafeRevealed = game.revealed.length === total - game.mines

      if (allSafeRevealed) {
        activeMinerGames.delete(user.id)
        const winAmount = game.betAmount * multiplier

        const [updatedUser] = await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: {
              balance: { increment: winAmount },
              totalWon: { increment: winAmount },
            },
          }),
          prisma.bet.update({
            where: { id: game.betId },
            data: {
              status: 'WON',
              winAmount,
              multiplier,
              gameData: { revealed: game.revealed, serverSeed: game.serverSeed },
            },
          }),
        ])

        return NextResponse.json({
          success: true,
          hit: false,
          allRevealed: true,
          multiplier,
          winAmount,
          balance: updatedUser.balance.toString(),
          serverSeed: game.serverSeed,
        })
      }

      return NextResponse.json({
        success: true,
        hit: false,
        cellIndex,
        isMine: false,
        multiplier,
        nextMultiplier,
        potentialWin,
        revealed: game.revealed,
      })
    }

    // === CASH OUT ===
    if (action === 'cashout') {
      const game = activeMinerGames.get(user.id)
      if (!game) return NextResponse.json({ error: 'No active game' }, { status: 400 })
      if (game.revealed.length === 0) return NextResponse.json({ error: 'Reveal at least one cell' }, { status: 400 })

      const total = game.rows * game.cols
      const multiplier = getMinerMultiplier(total, game.mines, game.revealed.length)
      const winAmount = game.betAmount * multiplier

      activeMinerGames.delete(user.id)

      const fullGrid = game.grid.map((isMine, idx) => ({
        index: idx,
        isMine,
        revealed: game.revealed.includes(idx),
      }))

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { increment: winAmount },
            totalWon: { increment: winAmount },
          },
        }),
        prisma.bet.update({
          where: { id: game.betId },
          data: {
            status: 'CASHOUT',
            winAmount,
            multiplier,
            gameData: { revealed: game.revealed, serverSeed: game.serverSeed },
          },
        }),
      ])

      // Pay referral commission
      await payReferralCommission(user.id, game.betAmount)

      return NextResponse.json({
        success: true,
        multiplier,
        winAmount,
        balance: updatedUser.balance.toString(),
        grid: fullGrid,
        serverSeed: game.serverSeed,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Miner game error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function payReferralCommission(userId: number, betAmount: number) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.referredBy) return

    const commissionPercent = parseFloat(process.env.REFERRAL_PERCENT || '5') / 100
    const commission = betAmount * commissionPercent

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.referredBy },
        data: { balance: { increment: commission } },
      }),
      prisma.referralEarning.create({
        data: {
          userId: user.referredBy,
          fromId: userId,
          amount: commission,
        },
      }),
    ])
  } catch (e) {
    console.error('Referral commission error:', e)
  }
}
