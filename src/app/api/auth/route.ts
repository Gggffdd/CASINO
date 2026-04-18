import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const referralCode = body.ref || null

    // Upsert user
    const user = await prisma.user.upsert({
      where: { id: tgUser.id },
      update: {
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
      },
      create: {
        id: tgUser.id,
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        isAdmin: String(tgUser.id) === process.env.TELEGRAM_ADMIN_ID,
        referredBy: null,
      },
    })

    // Handle referral on first registration
    if (referralCode && !user.referredBy) {
      const referrer = await prisma.user.findFirst({
        where: { referralCode },
      })
      if (referrer && referrer.id !== user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { referredBy: referrer.id },
        })
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        balance: user.balance.toString(),
        totalDeposit: user.totalDeposit.toString(),
        totalWithdraw: user.totalWithdraw.toString(),
        totalWon: user.totalWon.toString(),
        totalLost: user.totalLost.toString(),
        referralCode: user.referralCode,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
      },
    })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: tgUser.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.isBanned) {
      return NextResponse.json({ error: 'Account banned' }, { status: 403 })
    }

    const recentBets = await prisma.bet.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        balance: user.balance.toString(),
        totalDeposit: user.totalDeposit.toString(),
        totalWithdraw: user.totalWithdraw.toString(),
        totalWon: user.totalWon.toString(),
        totalLost: user.totalLost.toString(),
        referralCode: user.referralCode,
        isAdmin: user.isAdmin,
        isBanned: user.isBanned,
        createdAt: user.createdAt,
      },
      recentBets: recentBets.map(b => ({
        id: b.id,
        game: b.game,
        betAmount: b.betAmount.toString(),
        winAmount: b.winAmount.toString(),
        multiplier: b.multiplier.toString(),
        status: b.status,
        createdAt: b.createdAt,
      })),
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
