'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import BottomNav from './BottomNav'
import GamesTab from './tabs/GamesTab'
import WalletTab from './tabs/WalletTab'
import ProfileTab from './tabs/ProfileTab'
import ReferralTab from './tabs/ReferralTab'

export type Tab = 'games' | 'wallet' | 'referral' | 'profile'

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('games')
  const user = useUserStore(s => s.user)

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 glass border-b border-bg-border px-4 pt-3 pb-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 28 28" fill="none" className="w-7 h-7">
              <path d="M14 2L26 8V20L14 26L2 20V8L14 2Z" fill="url(#hGrad)"/>
              <path d="M14 9L17 12L14 15L11 12L14 9Z" fill="rgba(255,255,255,0.9)"/>
              <defs>
                <linearGradient id="hGrad" x1="2" y1="2" x2="26" y2="26">
                  <stop stopColor="#7c3aed"/><stop offset="1" stopColor="#9d5cf6"/>
                </linearGradient>
              </defs>
            </svg>
            <span className="text-lg font-black text-white tracking-wide">ROYAL</span>
          </div>
          <div className="flex items-center gap-2 bg-bg-card border border-bg-border rounded-xl px-3 py-1.5">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <circle cx="8" cy="8" r="7" fill="#26A17B"/>
              <text x="8" y="11.5" textAnchor="middle" fontSize="8" fontWeight="bold" fill="white">$</text>
            </svg>
            <span className="text-sm font-bold text-white font-mono">
              {parseFloat(user?.balance || '0').toFixed(2)}
            </span>
            <span className="text-xs text-text-muted">USDT</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-safe">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'games' && <GamesTab />}
            {activeTab === 'wallet' && <WalletTab />}
            {activeTab === 'referral' && <ReferralTab />}
            {activeTab === 'profile' && <ProfileTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
