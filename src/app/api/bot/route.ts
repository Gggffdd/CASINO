import { NextRequest, NextResponse } from 'next/server'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL!
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME || 'casino_bot'

export async function POST(request: NextRequest) {
  try {
    const update = await request.json()
    const msg = update.message
    if (!msg?.text) return NextResponse.json({ ok: true })
    const chatId = msg.chat.id
    const text = msg.text
    const userId = msg.from?.id

    if (text.startsWith('/start')) {
      const startParam = (text.split(' ')[1] || '')
      const ref = startParam.startsWith('ref_') ? startParam.replace('ref_', '') : ''
      const appUrl = ref ? `${APP_URL}?ref=${ref}` : APP_URL
      await sendMessage(chatId, `<b>Welcome to Royal Casino!</b>\n\nGames: Miner, Crash, Coinflip, Ladder, Tower, Slots\nDeposit via CryptoBot (USDT & TON)\n\nTap below to play!`, {
        reply_markup: { inline_keyboard: [[{ text: 'Open Casino', web_app: { url: appUrl } }]] },
      })
    }
    if (text === '/balance') {
      const { prisma } = await import('@/lib/db/prisma')
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) await sendMessage(chatId, `Balance: <b>${parseFloat(user.balance.toString()).toFixed(2)} USDT</b>`)
    }
    if (text === '/referral') {
      const { prisma } = await import('@/lib/db/prisma')
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user) {
        const link = `https://t.me/${BOT_USERNAME}?start=ref_${user.referralCode}`
        await sendMessage(chatId, `<b>Your referral link:</b>\n${link}\n\nEarn 5% from every bet your referrals make!`)
      }
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Bot error:', e)
    return NextResponse.json({ ok: true })
  }
}

async function sendMessage(chatId: number, text: string, extra?: any) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
}
