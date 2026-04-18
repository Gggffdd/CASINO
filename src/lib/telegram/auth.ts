import crypto from 'crypto'

export function validateTelegramWebApp(initData: string): boolean {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return false

    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(process.env.TELEGRAM_BOT_TOKEN!)
      .digest()

    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    return expectedHash === hash
  } catch {
    return false
  }
}

export function parseTelegramUser(initData: string) {
  try {
    const params = new URLSearchParams(initData)
    const userStr = params.get('user')
    if (!userStr) return null
    return JSON.parse(decodeURIComponent(userStr))
  } catch {
    return null
  }
}

export function getUserFromHeaders(request: Request) {
  const initData = request.headers.get('x-telegram-init-data')
  if (!initData) return null

  // In dev mode, skip validation
  if (process.env.NODE_ENV === 'development' && initData.startsWith('dev:')) {
    try {
      return JSON.parse(initData.replace('dev:', ''))
    } catch {
      return null
    }
  }

  if (!validateTelegramWebApp(initData)) return null
  return parseTelegramUser(initData)
}
