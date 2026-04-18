'use client'
import { useEffect } from 'react'
import { useCasinoStore } from '@/lib/store'

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setInitData, setInitialized, setLoading } = useCasinoStore()

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const tg = (window as any).Telegram?.WebApp
        let initData = ''

        if (tg && tg.initData) {
          tg.ready()
          tg.expand()
          tg.enableClosingConfirmation()
          tg.setHeaderColor('#0a0a0f')
          tg.setBackgroundColor('#0a0a0f')
          initData = tg.initData
        } else if (process.env.NODE_ENV === 'development') {
          // Dev mode mock
          initData = `dev:${JSON.stringify({
            id: 1043757036,
            first_name: 'Admin',
            username: 'admin',
            is_premium: true,
          })}`
        } else {
          console.warn('Not running inside Telegram WebApp')
          setInitialized(true)
          setLoading(false)
          return
        }

        setInitData(initData)

        // Get ref from start param
        const startParam = tg?.initDataUnsafe?.start_param || ''
        const refCode = startParam.startsWith('ref_') ? startParam.replace('ref_', '') : null

        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-telegram-init-data': initData,
          },
          body: JSON.stringify({ ref: refCode }),
        })

        const data = await res.json()
        if (data.success) {
          setUser(data.user)
        }
      } catch (error) {
        console.error('Init error:', error)
      } finally {
        setLoading(false)
        setInitialized(true)
      }
    }

    init()
  }, [])

  return <>{children}</>
}
