import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { validateCryptoBotWebhook, getCurrencyRates } from '@/lib/cryptobot'
import { notifyDeposit, notifyAdmin } from '@/lib/telegram/bot'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('crypto-pay-api-signature') || ''

    if (!validateCryptoBotWebhook(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)
    if (data.update_type !== 'invoice_paid') {
      return NextResponse.json({ success: true })
    }

    const invoice = data.payload
    const depositId = invoice.payload
    if (!depositId) return NextResponse.json({ success: true })

    const deposit = await prisma.deposit.findUnique({ where: { id: depositId } })
    if (!deposit || deposit.status !== 'PENDING') return NextResponse.json({ success: true })

    const rates = await getCurrencyRates()
    const paidAmount = parseFloat(invoice.paid_asset_amount || invoice.amount)
    const currency = invoice.paid_asset || invoice.asset || 'USDT'
    const amountUSDT = currency === 'USDT' ? paidAmount : paidAmount * (rates[currency] || 0)

    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data: { status: 'COMPLETED', amountUSDT, amount: paidAmount },
      }),
      prisma.user.update({
        where: { id: deposit.userId },
        data: {
          balance: { increment: amountUSDT },
          totalDeposit: { increment: amountUSDT },
        },
      }),
    ])

    // Referral bonus on first deposit
    const user = await prisma.user.findUnique({ where: { id: deposit.userId } })
    if (user?.referredBy) {
      const previousDeposits = await prisma.deposit.count({
        where: { userId: deposit.userId, status: 'COMPLETED', id: { not: depositId } },
      })
      if (previousDeposits === 0) {
        const bonus = amountUSDT * 0.05
        await prisma.$transaction([
          prisma.user.update({ where: { id: user.referredBy }, data: { balance: { increment: bonus } } }),
          prisma.referralEarning.create({ data: { userId: user.referredBy, fromId: deposit.userId, amount: bonus } }),
        ])
      }
    }

    await notifyDeposit(deposit.userId, amountUSDT.toFixed(2), 'USDT')
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
