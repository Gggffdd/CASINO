import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'

export async function GET(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const [referrals, earnings] = await Promise.all([
      prisma.user.findMany({ where: { referredBy: user.id }, select: { id: true, username: true, firstName: true, createdAt: true, totalDeposit: true } }),
      prisma.referralEarning.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ])

    const totalEarned = earnings.reduce((s, e) => s + parseFloat(e.amount.toString()), 0)
    const botUsername = process.env.NEXT_PUBLIC_BOT_USERNAME || 'casino_bot'
    const referralLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`

    return NextResponse.json({
      success: true,
      referralCode: user.referralCode,
      referralLink,
      referralCount: referrals.length,
      totalEarned: totalEarned.toFixed(2),
      referrals: referrals.map(r => ({ id: r.id, username: r.username, firstName: r.firstName, joinedAt: r.createdAt, deposited: parseFloat(r.totalDeposit.toString()) > 0 })),
      recentEarnings: earnings.map(e => ({ amount: e.amount.toString(), fromId: e.fromId, date: e.createdAt })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
