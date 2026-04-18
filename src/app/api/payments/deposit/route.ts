import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getUserFromHeaders } from '@/lib/telegram/auth'
import { createInvoice, getCurrencyRates } from '@/lib/cryptobot'

export async function POST(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { amount, currency = 'USDT' } = body

    if (!['USDT', 'TON'].includes(currency)) return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 })
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount < 1) return NextResponse.json({ error: 'Minimum deposit is 1 USDT' }, { status: 400 })

    const rates = await getCurrencyRates()
    const amountUSDT = currency === 'USDT' ? numAmount : numAmount * (rates.TON || 0)
    if (amountUSDT < 1) return NextResponse.json({ error: 'Minimum deposit is 1 USDT equivalent' }, { status: 400 })

    const deposit = await prisma.deposit.create({
      data: { userId: tgUser.id, amount: numAmount, amountUSDT, currency, status: 'PENDING' },
    })

    const invoice = await createInvoice({
      currencyType: 'crypto',
      asset: currency as 'USDT' | 'TON',
      amount: numAmount.toFixed(6),
      description: `Casino deposit — ${amountUSDT.toFixed(2)} USDT`,
      payload: deposit.id,
      paidBtnName: 'openBot',
      paidBtnUrl: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}`,
      expiresIn: 3600,
    })

    await prisma.deposit.update({
      where: { id: deposit.id },
      data: { cryptoBotInvoiceId: String(invoice.invoice_id) },
    })

    return NextResponse.json({
      success: true,
      invoiceUrl: invoice.bot_invoice_url || invoice.mini_app_invoice_url,
      invoiceId: invoice.invoice_id,
      amount: numAmount,
      amountUSDT: amountUSDT.toFixed(2),
      currency,
    })
  } catch (error) {
    console.error('Deposit error:', error)
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const tgUser = getUserFromHeaders(request)
    if (!tgUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const deposits = await prisma.deposit.findMany({
      where: { userId: tgUser.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json({ success: true, deposits })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
