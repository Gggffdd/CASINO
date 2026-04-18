import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = searchParams.get('secret')
  if (secret !== process.env.NEXTAUTH_SECRET) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  const [webhookRes] = await Promise.all([
    fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `${appUrl}/api/bot` }),
    }),
    fetch(`https://api.telegram.org/bot${botToken}/setMyCommands`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commands: [
        { command: 'start', description: 'Open Casino' },
        { command: 'balance', description: 'Check balance' },
        { command: 'referral', description: 'Get referral link' },
      ]}),
    }),
  ])

  return NextResponse.json({ webhook: await webhookRes.json(), message: 'Setup complete' })
}
