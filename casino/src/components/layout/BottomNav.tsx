'use client'
import { motion } from 'framer-motion'
import { Tab } from './HomeScreen'

const tabs: { id: Tab; label: string; icon: (active: boolean) => JSX.Element }[] = [
  {
    id: 'games',
    label: 'Games',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <circle cx="8" cy="13" r="2" fill={active ? '#9d5cf6' : '#6b6b85'}/>
        <path d="M16 11V15M14 13H18" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M8 4L10 6H14L16 4" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <rect x="2" y="6" width="20" height="14" rx="3" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <path d="M2 10H22" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <circle cx="17" cy="15" r="1.5" fill={active ? '#9d5cf6' : '#6b6b85'}/>
        <path d="M6 4L18 4" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'referral',
    label: 'Referral',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="9" cy="7" r="3" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <circle cx="17" cy="10" r="2" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <path d="M3 19C3 16.2 5.7 14 9 14" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M13 19C13 17.3 14.8 16 17 16C19.2 16 21 17.3 21 19" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 14C11 14 13 15 14 16.5" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
        <circle cx="12" cy="8" r="4" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5"/>
        <path d="M4 20C4 16.7 7.6 14 12 14C16.4 14 20 16.7 20 20" stroke={active ? '#9d5cf6' : '#6b6b85'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  },
]

export default function BottomNav({ activeTab, onTabChange }: { activeTab: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 glass border-t border-bg-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex max-w-lg mx-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center gap-1 py-3 relative btn-press"
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent-purple rounded-full"
              />
            )}
            {tab.icon(activeTab === tab.id)}
            <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-accent-purpleLight' : 'text-text-muted'}`}>
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
