import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'

async function requireAdmin(request: NextRequest) {
  const tgUser = getUserFromHeaders(request)
  if (!tgUser) return null
  const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
  if (!user?.isAdmin) return null
  return user
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'stats'

  if (action === 'stats') {
    const [totalUsers, deposits, withdrawals, bets] = await Promise.all([
      prisma.user.count(),
      prisma.deposit.aggregate({ where: { status: 'COMPLETED' }, _sum: { amountUSDT: true } }),
      prisma.withdrawal.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
      prisma.bet.count(),
    ])
    const totalDep = parseFloat(deposits._sum.amountUSDT?.toString() || '0')
    const totalWith = parseFloat(withdrawals._sum.amount?.toString() || '0')
    return NextResponse.json({ success: true, stats: { totalUsers, totalDeposits: totalDep.toFixed(2), totalWithdrawals: totalWith.toFixed(2), totalBets: bets, profit: (totalDep - totalWith).toFixed(2) } })
  }

  if (action === 'users') {
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const users = await prisma.user.findMany({
      where: search ? { OR: [{ username: { contains: search } }, { firstName: { contains: search } }] } : {},
      orderBy: { createdAt: 'desc' },
      take: 20, skip: (page - 1) * 20,
    })
    return NextResponse.json({ success: true, users })
  }

  if (action === 'withdrawals') {
    const pending = await prisma.withdrawal.findMany({ where: { status: 'PENDING' }, include: { user: { select: { username: true, firstName: true } } }, orderBy: { createdAt: 'desc' } })
    return NextResponse.json({ success: true, withdrawals: pending })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin(request)
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { action, userId, withdrawalId, note } = body

  if (action === 'ban_user') {
    await prisma.user.update({ where: { id: userId }, data: { isBanned: true } })
    return NextResponse.json({ success: true })
  }
  if (action === 'unban_user') {
    await prisma.user.update({ where: { id: userId }, data: { isBanned: false } })
    return NextResponse.json({ success: true })
  }
  if (action === 'add_balance') {
    const { amount } = body
    await prisma.user.update({ where: { id: userId }, data: { balance: { increment: parseFloat(amount) } } })
    return NextResponse.json({ success: true })
  }
  if (action === 'approve_withdrawal') {
    await prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'COMPLETED', adminNote: note } })
    return NextResponse.json({ success: true })
  }
  if (action === 'reject_withdrawal') {
    const withdrawal = await prisma.withdrawal.findUnique({ where: { id: withdrawalId } })
    if (!withdrawal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    await prisma.$transaction([
      prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: 'FAILED', adminNote: note } }),
      prisma.user.update({ where: { id: withdrawal.userId }, data: { balance: { increment: withdrawal.amount }, totalWithdraw: { decrement: withdrawal.amount } } }),
    ])
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
