import { create } from 'zustand'
import { UserData } from '@/types'

interface CasinoStore {
  user: UserData | null
  initData: string | null
  isLoading: boolean
  isInitialized: boolean

  setUser: (user: UserData) => void
  setInitData: (data: string) => void
  updateBalance: (balance: string) => void
  setLoading: (v: boolean) => void
  setInitialized: (v: boolean) => void
}

export const useCasinoStore = create<CasinoStore>((set) => ({
  user: null,
  initData: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),
  setInitData: (data) => set({ initData: data }),
  updateBalance: (balance) =>
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    })),
  setLoading: (v) => set({ isLoading: v }),
  setInitialized: (v) => set({ isInitialized: v }),
}))
