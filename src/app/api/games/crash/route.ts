import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { generateCrashPoint, generateSeed, hashSeed } from '@/lib/games/crash'

// Crash game server state
interface CrashState {
  gameId: string
  phase: 'waiting' | 'running' | 'crashed'
  seed: string
  seedHash: string
  crashPoint: number
  startTime: number | null
  bets: Map<number, { betId: string; amount: number; cashedOut: boolean; cashoutMultiplier: number | null }>
}

let currentCrash: CrashState = createNewCrash()

function createNewCrash(): CrashState {
  const seed = generateSeed()
  const crashPoint = generateCrashPoint(seed)
  return {
    gameId: seed.slice(0, 16),
    phase: 'waiting',
    seed,
    seedHash: hashSeed(seed),
    crashPoint,
    startTime: null,
    bets: new Map(),
  }
}

// GET - current game state
export async function GET(request: NextRequest) {
  const tgUser = getUserFromHeaders(request)
  if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userBet = currentCrash.bets.get(tgUser.id)
  const elapsed = currentCrash.startTime ? Date.now() - currentCrash.startTime : 0
  const currentMultiplier = currentCrash.phase === 'running'
    ? Math.floor(Math.pow(Math.E, 0.00006 * elapsed) * 100) / 100
    : currentCrash.phase === 'crashed' ? currentCrash.crashPoint : 1

  return NextResponse.json({
    gameId: currentCrash.gameId,
    phase: currentCrash.phase,
    seedHash: currentCrash.seedHash,
    currentMultiplier,
    startTime: currentCrash.startTime,
    myBet: userBet ? {
      amount: userBet.amount,
      cashedOut: userBet.cashedOut,
      cashoutMultiplier: userBet.cashoutMultiplier,
    } : null,
    // Reveal seed when crashed
    seed: currentCrash.phase === 'crashed' ? currentCrash.seed : null,
    crashPoint: currentCrash.phase === 'crashed' ? currentCrash.crashPoint : null,
  })
}

// POST - place bet or cashout
export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, betAmount, autoCashout } = body

    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // === PLACE BET ===
    if (action === 'bet') {
      if (currentCrash.phase !== 'waiting') {
        return NextResponse.json({ error: 'Round already started' }, { status: 400 })
      }
      if (currentCrash.bets.has(user.id)) {
        return NextResponse.json({ error: 'Already placed a bet' }, { status: 400 })
      }

      const amount = parseFloat(betAmount)
      if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid bet' }, { status: 400 })
      if (parseFloat(user.balance.toString()) < amount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }

      const [updatedUser, bet] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: amount } },
        }),
        prisma.bet.create({
          data: {
            userId: user.id,
            game: 'CRASH',
            betAmount: amount,
            status: 'PENDING',
            gameData: { gameId: currentCrash.gameId, autoCashout },
          },
        }),
      ])

      currentCrash.bets.set(user.id, {
        betId: bet.id,
        amount,
        cashedOut: false,
        cashoutMultiplier: null,
      })

      return NextResponse.json({
        success: true,
        betId: bet.id,
        balance: updatedUser.balance.toString(),
      })
    }

    // === CASHOUT ===
    if (action === 'cashout') {
      if (currentCrash.phase !== 'running') {
        return NextResponse.json({ error: 'Game not running' }, { status: 400 })
      }

      const userBet = currentCrash.bets.get(user.id)
      if (!userBet) return NextResponse.json({ error: 'No active bet' }, { status: 400 })
      if (userBet.cashedOut) return NextResponse.json({ error: 'Already cashed out' }, { status: 400 })

      // Calculate current multiplier
      const elapsed = Date.now() - currentCrash.startTime!
      const multiplier = Math.floor(Math.pow(Math.E, 0.00006 * elapsed) * 100) / 100

      // Make sure we haven't crashed yet
      if (multiplier >= currentCrash.crashPoint) {
        return NextResponse.json({ error: 'Game already crashed' }, { status: 400 })
      }

      const winAmount = userBet.amount * multiplier
      userBet.cashedOut = true
      userBet.cashoutMultiplier = multiplier

      const [updatedUser] = await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            balance: { increment: winAmount },
            totalWon: { increment: winAmount },
          },
        }),
        prisma.bet.update({
          where: { id: userBet.betId },
          data: {
            status: 'CASHOUT',
            winAmount,
            multiplier,
          },
        }),
      ])

      return NextResponse.json({
        success: true,
        multiplier,
        winAmount,
        balance: updatedUser.balance.toString(),
      })
    }

    // === ADVANCE PHASE (server-side, called by cron or internal) ===
    if (action === 'next_phase') {
      // Verify it's the server calling this
      const authHeader = request.headers.get('x-internal-secret')
      if (authHeader !== process.env.NEXTAUTH_SECRET) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if (currentCrash.phase === 'waiting') {
        currentCrash.phase = 'running'
        currentCrash.startTime = Date.now()
      } else if (currentCrash.phase === 'running') {
        // Crash! Settle all remaining bets
        currentCrash.phase = 'crashed'
        
        for (const [userId, bet] of currentCrash.bets.entries()) {
          if (!bet.cashedOut) {
            await prisma.$transaction([
              prisma.bet.update({
                where: { id: bet.betId },
                data: {
                  status: 'LOST',
                  gameData: { crashPoint: currentCrash.crashPoint, gameId: currentCrash.gameId },
                },
              }),
              prisma.user.update({
                where: { id: userId },
                data: { totalLost: { increment: bet.amount } },
              }),
            ])
          }
        }

        // Save crash record
        await prisma.crashGame.create({
          data: {
            multiplier: currentCrash.crashPoint,
            seed: currentCrash.seed,
          },
        })

        // Schedule next round
        setTimeout(() => {
          currentCrash = createNewCrash()
        }, 5000)
      }

      return NextResponse.json({ success: true, phase: currentCrash.phase })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Crash error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
