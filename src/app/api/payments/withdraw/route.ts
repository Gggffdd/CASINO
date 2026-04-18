import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { transfer } from '@/lib/cryptobot'
import { notifyWithdrawal, notifyAdmin } from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { amount, currency = 'USDT' } = body
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < 2) return NextResponse.json({ error: 'Minimum withdrawal is 2 USDT' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { id: tgUser.id } })
    if (!user || user.isBanned) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (parseFloat(user.balance.toString()) < numAmount) return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })

    const [updatedUser, withdrawal] = await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: numAmount }, totalWithdraw: { increment: numAmount } } }),
      prisma.withdrawal.create({ data: { userId: user.id, amount: numAmount, currency, status: 'PENDING' } }),
    ])

    // Auto-transfer via CryptoBot
    try {
      await transfer({
        userId: tgUser.id,
        asset: currency as 'USDT' | 'TON',
        amount: numAmount.toFixed(6),
        spendId: withdrawal.id,
        comment: 'Casino withdrawal',
      })
      await prisma.withdrawal.update({ where: { id: withdrawal.id }, data: { status: 'COMPLETED' } })
      await notifyWithdrawal(user.id, numAmount.toFixed(2), currency, 'COMPLETED')
    } catch (transferErr) {
      console.error('Transfer failed, marking manual:', transferErr)
      await notifyAdmin(`Manual withdrawal needed\nUser: ${user.id}\nAmount: ${numAmount} ${currency}\nWithdrawal ID: ${withdrawal.id}`)
    }

    return NextResponse.json({ success: true, balance: updatedUser.balance.toString(), withdrawalId: withdrawal.id })
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
