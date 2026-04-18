'use client'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/useUser'
import HomeScreen from '@/components/layout/HomeScreen'
import LoadingScreen from '@/components/ui/LoadingScreen'

declare global {
  interface Window { Telegram?: any }
}

export default function App() {
  const { setInitData, fetchUser, isLoading } = useUserStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    if (tg) {
      tg.ready()
      tg.expand()
      tg.setBackgroundColor('#0a0a0f')
      tg.setHeaderColor('#0a0a0f')
      tg.disableClosingConfirmation?.()

      const initData = tg.initData
      if (initData) {
        setInitData(initData)
        // Register/fetch user
        fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData },
          body: JSON.stringify({ ref: new URLSearchParams(tg.initDataUnsafe?.start_param || '').get('ref') }),
        })
          .then(r => r.json())
          .then(d => {
            if (d.user) useUserStore.getState().setUser(d.user)
          })
          .finally(() => setReady(true))
      } else {
        setReady(true)
      }
    } else {
      // Dev mode
      const devData = 'dev:{"id":12345,"first_name":"Test","username":"testuser"}'
      setInitData(devData)
      fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': devData },
        body: JSON.stringify({}),
      })
        .then(r => r.json())
        .then(d => { if (d.user) useUserStore.getState().setUser(d.user) })
        .finally(() => setReady(true))
    }
  }, [])

  if (!ready) return <LoadingScreen />

  return <HomeScreen />
}
