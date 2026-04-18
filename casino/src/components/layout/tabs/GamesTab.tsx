'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import MinerGame from '@/components/games/MinerGame'
import CrashGame from '@/components/games/CrashGame'
import CoinflipGame from '@/components/games/CoinflipGame'
import LadderGame from '@/components/games/LadderGame'
import TowerGame from '@/components/games/TowerGame'
import SlotsGame from '@/components/games/SlotsGame'

type GameId = 'miner' | 'crash' | 'coinflip' | 'ladder' | 'tower' | 'slots_dog' | 'slots_sugar'

interface GameCard {
  id: GameId
  name: string
  desc: string
  badge?: string
  gradient: string
  icon: JSX.Element
}

const GAMES: GameCard[] = [
  {
    id: 'miner',
    name: 'Miner',
    desc: 'Avoid bombs, multiply wins',
    badge: 'Popular',
    gradient: 'from-purple-900/60 to-purple-700/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <rect x="4" y="4" width="40" height="40" rx="6" fill="rgba(124,58,237,0.2)"/>
        {[0,1,2,3].map(row => [0,1,2,3].map(col => (
          <rect key={`${row}-${col}`} x={8+col*10} y={8+row*10} width="8" height="8" rx="2"
            fill={row===1&&col===2 ? 'rgba(239,68,68,0.6)' : row===2&&col===0 ? 'rgba(239,68,68,0.6)' : 'rgba(124,58,237,0.3)'}
            stroke="rgba(124,58,237,0.5)" strokeWidth="0.5"/>
        )))}
        <circle cx="18" cy="18" r="3" fill="rgba(239,68,68,0.8)"/>
        <circle cx="28" cy="28" r="3" fill="rgba(239,68,68,0.8)"/>
        <circle cx="14" cy="34" r="2" fill="rgba(16,185,129,0.9)"/>
      </svg>
    ),
  },
  {
    id: 'crash',
    name: 'Crash',
    desc: 'Cash out before it crashes',
    badge: 'Live',
    gradient: 'from-red-900/60 to-orange-700/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <path d="M6 40 Q12 38 16 32 Q20 26 24 20 Q28 14 32 10 Q36 6 40 8" stroke="url(#cg1)" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <path d="M6 40 Q12 38 16 32 Q20 26 24 20 Q28 14 32 10 Q36 6 40 8 L40 40 Z" fill="url(#cfill)" opacity="0.3"/>
        <circle cx="40" cy="8" r="4" fill="#ef4444"/>
        <path d="M37 5L43 5M43 5L43 11M43 5L38 10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        <defs>
          <linearGradient id="cg1" x1="6" y1="40" x2="40" y2="8"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#ef4444"/></linearGradient>
          <linearGradient id="cfill" x1="6" y1="8" x2="6" y2="40"><stop stopColor="#ef4444"/><stop offset="1" stopColor="transparent"/></linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'coinflip',
    name: 'Coinflip',
    desc: '50/50 double your bet',
    gradient: 'from-yellow-900/60 to-yellow-600/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <circle cx="24" cy="24" r="18" fill="url(#coinGrad)" stroke="rgba(245,158,11,0.5)" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="14" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        <text x="24" y="29" textAnchor="middle" fontSize="14" fontWeight="bold" fill="rgba(255,255,255,0.9)">$</text>
        <defs>
          <linearGradient id="coinGrad" x1="6" y1="6" x2="42" y2="42"><stop stopColor="#f59e0b"/><stop offset="1" stopColor="#d97706"/></linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'ladder',
    name: 'Ladder',
    desc: 'Climb rows, avoid traps',
    gradient: 'from-blue-900/60 to-cyan-700/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <line x1="12" y1="6" x2="12" y2="42" stroke="rgba(59,130,246,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="36" y1="6" x2="36" y2="42" stroke="rgba(59,130,246,0.6)" strokeWidth="2.5" strokeLinecap="round"/>
        {[10,18,26,34].map((y,i) => (
          <line key={y} x1="12" y1={y} x2="36" y2={y} stroke={i===0?'rgba(16,185,129,0.9)':i===3?'rgba(239,68,68,0.7)':'rgba(59,130,246,0.7)'} strokeWidth="2" strokeLinecap="round"/>
        ))}
        <circle cx="24" cy="38" r="4" fill="rgba(59,130,246,0.8)"/>
      </svg>
    ),
  },
  {
    id: 'tower',
    name: 'Tower',
    desc: 'Reach the top for big wins',
    gradient: 'from-green-900/60 to-emerald-700/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <polygon points="24,4 40,14 40,42 8,42 8,14" fill="url(#towerGrad)" opacity="0.7"/>
        <rect x="14" y="30" width="8" height="12" rx="1" fill="rgba(16,185,129,0.8)"/>
        <rect x="26" y="30" width="8" height="12" rx="1" fill="rgba(239,68,68,0.6)"/>
        <rect x="14" y="18" width="8" height="10" rx="1" fill="rgba(16,185,129,0.6)"/>
        <rect x="26" y="18" width="8" height="10" rx="1" fill="rgba(16,185,129,0.8)"/>
        <polygon points="24,4 32,10 24,16 16,10" fill="rgba(245,158,11,0.9)"/>
        <defs>
          <linearGradient id="towerGrad" x1="8" y1="4" x2="40" y2="42"><stop stopColor="#059669"/><stop offset="1" stopColor="#064e3b"/></linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: 'slots_dog',
    name: 'Dog House',
    desc: 'Spin with dog wilds',
    badge: 'Bonus',
    gradient: 'from-pink-900/60 to-purple-700/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <rect x="4" y="12" width="12" height="28" rx="3" fill="rgba(124,58,237,0.4)" stroke="rgba(124,58,237,0.5)" strokeWidth="1"/>
        <rect x="18" y="12" width="12" height="28" rx="3" fill="rgba(245,158,11,0.4)" stroke="rgba(245,158,11,0.5)" strokeWidth="1"/>
        <rect x="32" y="12" width="12" height="28" rx="3" fill="rgba(239,68,68,0.4)" stroke="rgba(239,68,68,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="26" r="4" fill="rgba(124,58,237,0.8)"/>
        <circle cx="24" cy="26" r="4" fill="rgba(245,158,11,0.8)"/>
        <circle cx="38" cy="26" r="4" fill="rgba(124,58,237,0.8)"/>
        <path d="M4 28H44" stroke="rgba(255,255,255,0.1)" strokeWidth="1"/>
      </svg>
    ),
  },
  {
    id: 'slots_sugar',
    name: 'Sugar Rush',
    desc: 'Sweet wins await you',
    gradient: 'from-pink-900/60 to-rose-600/40',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
        <rect x="4" y="12" width="12" height="28" rx="3" fill="rgba(236,72,153,0.3)" stroke="rgba(236,72,153,0.5)" strokeWidth="1"/>
        <rect x="18" y="12" width="12" height="28" rx="3" fill="rgba(249,115,22,0.3)" stroke="rgba(249,115,22,0.5)" strokeWidth="1"/>
        <rect x="32" y="12" width="12" height="28" rx="3" fill="rgba(16,185,129,0.3)" stroke="rgba(16,185,129,0.5)" strokeWidth="1"/>
        <circle cx="10" cy="24" r="4" fill="rgba(236,72,153,0.9)"/>
        <circle cx="24" cy="24" r="4" fill="rgba(249,115,22,0.9)"/>
        <circle cx="38" cy="24" r="4" fill="rgba(236,72,153,0.9)"/>
        <path d="M10 8 Q12 4 14 8" stroke="rgba(236,72,153,0.8)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
        <path d="M22 8 Q24 4 26 8" stroke="rgba(249,115,22,0.8)" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
  },
]

export default function GamesTab() {
  const [activeGame, setActiveGame] = useState<GameId | null>(null)

  const renderGame = () => {
    switch (activeGame) {
      case 'miner': return <MinerGame onBack={() => setActiveGame(null)} />
      case 'crash': return <CrashGame onBack={() => setActiveGame(null)} />
      case 'coinflip': return <CoinflipGame onBack={() => setActiveGame(null)} />
      case 'ladder': return <LadderGame onBack={() => setActiveGame(null)} />
      case 'tower': return <TowerGame onBack={() => setActiveGame(null)} />
      case 'slots_dog': return <SlotsGame type="dog" onBack={() => setActiveGame(null)} />
      case 'slots_sugar': return <SlotsGame type="sugar" onBack={() => setActiveGame(null)} />
      default: return null
    }
  }

  if (activeGame) {
    return (
      <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
        {renderGame()}
      </motion.div>
    )
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-5 h-32 bg-gradient-to-br from-purple-900 via-violet-800 to-indigo-900">
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <p className="text-xs text-purple-300 font-medium mb-1">Welcome to</p>
          <h2 className="text-2xl font-black text-white">ROYAL CASINO</h2>
          <p className="text-xs text-purple-200 mt-1">7 games, real USDT wins</p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-32 opacity-20">
          <svg viewBox="0 0 80 120" fill="none" className="w-full h-full">
            <circle cx="40" cy="30" r="25" stroke="white" strokeWidth="1.5"/>
            <circle cx="40" cy="90" r="20" stroke="white" strokeWidth="1.5"/>
            <line x1="40" y1="5" x2="40" y2="115" stroke="white" strokeWidth="1"/>
          </svg>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Choose a Game</h3>

      <div className="grid grid-cols-2 gap-3">
        {GAMES.map((game, i) => (
          <motion.button
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setActiveGame(game.id)}
            className={`relative bg-gradient-to-br ${game.gradient} border border-bg-border rounded-2xl p-3 text-left btn-press overflow-hidden`}
          >
            {game.badge && (
              <span className="absolute top-2 right-2 text-[9px] font-bold bg-accent-purple text-white px-1.5 py-0.5 rounded-full">
                {game.badge}
              </span>
            )}
            <div className="w-12 h-12 mb-2">{game.icon}</div>
            <p className="text-sm font-bold text-white">{game.name}</p>
            <p className="text-[11px] text-text-muted leading-tight mt-0.5">{game.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}
