'use client'
import { useCasinoStore } from '@/lib/store'

export function useApi() {
  const { initData } = useCasinoStore()

  const request = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (initData) {
      headers['x-telegram-init-data'] = initData
    }

    const res = await fetch(url, {
      ...options,
      headers,
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Request failed')
    }
    return data
  }

  return {
    get: (url: string) => request(url, { method: 'GET' }),
    post: (url: string, body: any) => request(url, { method: 'POST', body: JSON.stringify(body) }),
  }
}
