const CRYPTO_BOT_TOKEN = process.env.CRYPTO_BOT_TOKEN!
const CRYPTO_BOT_API_URL = process.env.CRYPTO_BOT_API_URL || 'https://pay.crypt.bot/api'

async function cryptoBotRequest(method: string, params?: Record<string, any>) {
  const res = await fetch(`${CRYPTO_BOT_API_URL}/${method}`, {
    method: 'POST',
    headers: {
      'Crypto-Pay-API-Token': CRYPTO_BOT_TOKEN,
      'Content-Type': 'application/json',
    },
    body: params ? JSON.stringify(params) : undefined,
  })

  const data = await res.json()
  if (!data.ok) {
    throw new Error(`CryptoBot error: ${data.error?.name || 'Unknown error'}`)
  }
  return data.result
}

export async function createInvoice(params: {
  currencyType: 'crypto'
  asset: 'USDT' | 'TON' | 'BTC'
  amount: string
  description?: string
  hiddenMessage?: string
  payload?: string
  paidBtnName?: 'openBot' | 'openChannel' | 'callback' | 'openUrl'
  paidBtnUrl?: string
  expiresIn?: number
}) {
  return cryptoBotRequest('createInvoice', {
    currency_type: params.currencyType,
    asset: params.asset,
    amount: params.amount,
    description: params.description,
    hidden_message: params.hiddenMessage,
    payload: params.payload,
    paid_btn_name: params.paidBtnName,
    paid_btn_url: params.paidBtnUrl,
    expires_in: params.expiresIn || 3600,
    accept_fiat: false,
  })
}

export async function getInvoices(params?: {
  asset?: string
  invoiceIds?: string
  status?: 'active' | 'paid'
  offset?: number
  count?: number
}) {
  return cryptoBotRequest('getInvoices', params)
}

export async function transfer(params: {
  userId: number
  asset: 'USDT' | 'TON'
  amount: string
  spendId: string
  comment?: string
}) {
  return cryptoBotRequest('transfer', {
    user_id: params.userId,
    asset: params.asset,
    amount: params.amount,
    spend_id: params.spendId,
    comment: params.comment,
  })
}

// Validate CryptoBot webhook signature
export function validateCryptoBotWebhook(body: string, signature: string): boolean {
  const crypto = require('crypto')
  const secret = crypto
    .createHash('sha256')
    .update(CRYPTO_BOT_TOKEN)
    .digest()
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex')
  return expectedSignature === signature
}

// Get TON to USDT exchange rate
export async function getExchangeRate(from: string, to: string): Promise<number> {
  try {
    const result = await cryptoBotRequest('getExchangeRates')
    const pair = result.find(
      (r: any) => r.source === from && r.target === to
    )
    return pair ? parseFloat(pair.rate) : 0
  } catch {
    // Fallback to CoinGecko if CryptoBot doesn't support
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd`,
        { next: { revalidate: 60 } }
      )
      const data = await res.json()
      return data['the-open-network']?.usd || 0
    } catch {
      return 0
    }
  }
}

export async function getCurrencyRates(): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether,the-open-network,bitcoin&vs_currencies=usd',
      { next: { revalidate: 60 } }
    )
    const data = await res.json()
    return {
      USDT: data.tether?.usd || 1,
      TON: data['the-open-network']?.usd || 0,
      BTC: data.bitcoin?.usd || 0,
    }
  } catch {
    return { USDT: 1, TON: 0, BTC: 0 }
  }
}
