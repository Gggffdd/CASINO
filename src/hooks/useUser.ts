import { create } from 'zustand'
import { UserData } from '@/types'

interface UserStore {
  user: UserData | null
  initData: string | null
  isLoading: boolean
  setUser: (user: UserData) => void
  setInitData: (data: string) => void
  updateBalance: (balance: string) => void
  fetchUser: () => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  initData: null,
  isLoading: true,

  setUser: (user) => set({ user }),
  setInitData: (data) => set({ initData: data }),
  updateBalance: (balance) => set(state => ({ user: state.user ? { ...state.user, balance } : null })),

  fetchUser: async () => {
    const { initData } = get()
    if (!initData) return
    try {
      set({ isLoading: true })
      const res = await fetch('/api/auth', {
        headers: { 'x-telegram-init-data': initData },
      })
      if (res.ok) {
        const data = await res.json()
        set({ user: data.user })
      }
    } catch (e) {
      console.error('Fetch user error:', e)
    } finally {
      set({ isLoading: false })
    }
  },
}))

export function useApiHeaders() {
  const initData = useUserStore(s => s.initData)
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-telegram-init-data': initData || '',
    },
  }
}
