const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const ADMIN_ID = process.env.TELEGRAM_ADMIN_ID!

export async function sendTelegramMessage(chatId: number | string, text: string, options?: any) {
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        ...options,
      }),
    })
    return await res.json()
  } catch (e) {
    console.error('Telegram send error:', e)
  }
}

export async function notifyAdmin(text: string) {
  return sendTelegramMessage(ADMIN_ID, text)
}

export async function notifyDeposit(userId: number, amount: string, currency: string) {
  await sendTelegramMessage(
    userId,
    `<b>Deposit confirmed!</b>\n\nAmount: <b>${amount} ${currency}</b>\n\nYour balance has been updated. Good luck!`
  )
  await notifyAdmin(
    `<b>New deposit</b>\nUser: <code>${userId}</code>\nAmount: ${amount} ${currency}`
  )
}

export async function notifyWithdrawal(userId: number, amount: string, currency: string, status: string) {
  const statusText = status === 'COMPLETED' ? 'processed' : status === 'FAILED' ? 'rejected' : 'received'
  await sendTelegramMessage(
    userId,
    `<b>Withdrawal ${statusText}</b>\n\nAmount: <b>${amount} ${currency}</b>`
  )
}
