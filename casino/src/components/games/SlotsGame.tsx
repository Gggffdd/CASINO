'use client'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

type SlotType = 'dog' | 'sugar'

const DOG_SYMBOLS = [
  { id: 'scatter', color: '#f59e0b', label: 'S', bg: 'rgba(245,158,11,0.2)' },
  { id: 'wild', color: '#7c3aed', label: 'W', bg: 'rgba(124,58,237,0.2)' },
  { id: 'purple_dog', color: '#9d5cf6', label: 'P', bg: 'rgba(157,92,246,0.15)' },
  { id: 'blue_dog', color: '#3b82f6', label: 'B', bg: 'rgba(59,130,246,0.15)' },
  { id: 'green_dog', color: '#10b981', label: 'G', bg: 'rgba(16,185,129,0.15)' },
  { id: 'yellow_dog', color: '#f59e0b', label: 'Y', bg: 'rgba(245,158,11,0.12)' },
  { id: 'paw', color: '#ef4444', label: 'PAW', bg: 'rgba(239,68,68,0.12)' },
  { id: 'bone', color: '#a0a0b8', label: 'BNE', bg: 'rgba(160,160,184,0.1)' },
]

const SUGAR_SYMBOLS = [
  { id: 'scatter', color: '#f59e0b', label: 'S', bg: 'rgba(245,158,11,0.2)' },
  { id: 'wild', color: '#7c3aed', label: 'W', bg: 'rgba(124,58,237,0.2)' },
  { id: 'candy_heart', color: '#ec4899', label: 'HRT', bg: 'rgba(236,72,153,0.15)' },
  { id: 'lollipop', color: '#f97316', label: 'LLP', bg: 'rgba(249,115,22,0.15)' },
  { id: 'gummy', color: '#10b981', label: 'GUM', bg: 'rgba(16,185,129,0.15)' },
  { id: 'chocolate', color: '#92400e', label: 'CHC', bg: 'rgba(146,64,14,0.15)' },
  { id: 'cupcake', color: '#f472b6', label: 'CUP', bg: 'rgba(244,114,182,0.12)' },
  { id: 'candy', color: '#60a5fa', label: 'CND', bg: 'rgba(96,165,250,0.1)' },
]

function SymbolCell({ symId, type, highlight }: { symId: string; type: SlotType; highlight?: boolean }) {
  const syms = type === 'dog' ? DOG_SYMBOLS : SUGAR_SYMBOLS
  const sym = syms.find(s => s.id === symId) || syms[syms.length - 1]

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg transition-all
      ${highlight ? 'ring-2 ring-accent-gold' : ''}`}
      style={{ background: sym.bg }}>
      {/* SVG icon based on symbol */}
      <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7">
        {symId === 'scatter' && (
          <>
            <circle cx="16" cy="16" r="12" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" strokeWidth="1.5"/>
            <text x="16" y="21" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f59e0b">SCAT</text>
          </>
        )}
        {symId === 'wild' && (
          <>
            <rect x="4" y="8" width="24" height="16" rx="4" fill="rgba(124,58,237,0.4)" stroke="#7c3aed" strokeWidth="1.5"/>
            <text x="16" y="20" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#9d5cf6">WILD</text>
          </>
        )}
        {symId === 'purple_dog' && (
          <>
            <ellipse cx="16" cy="20" rx="10" ry="7" fill="rgba(157,92,246,0.3)"/>
            <circle cx="16" cy="13" r="7" fill="rgba(157,92,246,0.6)" stroke="#9d5cf6" strokeWidth="1"/>
            <circle cx="13" cy="12" r="1.5" fill="white"/>
            <circle cx="19" cy="12" r="1.5" fill="white"/>
            <ellipse cx="13" cy="9" rx="3" ry="2" fill="rgba(157,92,246,0.9)"/>
            <ellipse cx="19" cy="9" rx="3" ry="2" fill="rgba(157,92,246,0.9)"/>
          </>
        )}
        {symId === 'blue_dog' && (
          <>
            <ellipse cx="16" cy="20" rx="10" ry="7" fill="rgba(59,130,246,0.3)"/>
            <circle cx="16" cy="13" r="7" fill="rgba(59,130,246,0.6)" stroke="#3b82f6" strokeWidth="1"/>
            <circle cx="13" cy="12" r="1.5" fill="white"/>
            <circle cx="19" cy="12" r="1.5" fill="white"/>
            <ellipse cx="13" cy="9" rx="3" ry="2" fill="rgba(59,130,246,0.9)"/>
            <ellipse cx="19" cy="9" rx="3" ry="2" fill="rgba(59,130,246,0.9)"/>
          </>
        )}
        {symId === 'green_dog' && (
          <>
            <ellipse cx="16" cy="20" rx="9" ry="6" fill="rgba(16,185,129,0.3)"/>
            <circle cx="16" cy="13" r="7" fill="rgba(16,185,129,0.6)" stroke="#10b981" strokeWidth="1"/>
            <circle cx="13" cy="12" r="1.5" fill="white"/>
            <circle cx="19" cy="12" r="1.5" fill="white"/>
          </>
        )}
        {symId === 'yellow_dog' && (
          <>
            <circle cx="16" cy="14" r="7" fill="rgba(245,158,11,0.5)" stroke="#f59e0b" strokeWidth="1"/>
            <circle cx="13" cy="13" r="1.5" fill="white"/>
            <circle cx="19" cy="13" r="1.5" fill="white"/>
            <path d="M13 18 Q16 21 19 18" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          </>
        )}
        {symId === 'paw' && (
          <>
            <circle cx="16" cy="18" r="5" fill="rgba(239,68,68,0.5)"/>
            <circle cx="10" cy="13" r="2.5" fill="rgba(239,68,68,0.5)"/>
            <circle cx="22" cy="13" r="2.5" fill="rgba(239,68,68,0.5)"/>
            <circle cx="13" cy="11" r="2" fill="rgba(239,68,68,0.5)"/>
            <circle cx="19" cy="11" r="2" fill="rgba(239,68,68,0.5)"/>
          </>
        )}
        {symId === 'bone' && (
          <>
            <rect x="10" y="14" width="12" height="4" rx="2" fill="rgba(160,160,184,0.6)"/>
            <circle cx="10" cy="16" r="3" fill="rgba(160,160,184,0.6)"/>
            <circle cx="22" cy="16" r="3" fill="rgba(160,160,184,0.6)"/>
          </>
        )}
        {symId === 'candy_heart' && (
          <>
            <path d="M16 26 L6 16 C4 12 6 8 10 8 C12 8 14 9 16 11 C18 9 20 8 22 8 C26 8 28 12 26 16 Z" fill="rgba(236,72,153,0.6)" stroke="#ec4899" strokeWidth="1"/>
          </>
        )}
        {symId === 'lollipop' && (
          <>
            <circle cx="16" cy="12" r="8" fill="rgba(249,115,22,0.5)" stroke="#f97316" strokeWidth="1.5"/>
            <circle cx="16" cy="12" r="5" fill="rgba(249,115,22,0.3)"/>
            <line x1="16" y1="20" x2="16" y2="28" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
          </>
        )}
        {symId === 'gummy' && (
          <>
            <ellipse cx="16" cy="16" rx="9" ry="11" fill="rgba(16,185,129,0.5)" stroke="#10b981" strokeWidth="1"/>
            <circle cx="13" cy="13" r="2" fill="rgba(255,255,255,0.3)"/>
            <circle cx="19" cy="13" r="2" fill="rgba(255,255,255,0.3)"/>
          </>
        )}
        {symId === 'chocolate' && (
          <>
            <rect x="6" y="8" width="20" height="16" rx="3" fill="rgba(146,64,14,0.6)" stroke="#92400e" strokeWidth="1"/>
            <line x1="6" y1="14" x2="26" y2="14" stroke="rgba(146,64,14,0.9)" strokeWidth="1"/>
            <line x1="16" y1="8" x2="16" y2="24" stroke="rgba(146,64,14,0.9)" strokeWidth="1"/>
          </>
        )}
        {symId === 'cupcake' && (
          <>
            <path d="M8 18 Q12 12 16 11 Q20 12 24 18 Z" fill="rgba(244,114,182,0.5)"/>
            <rect x="10" y="18" width="12" height="7" rx="2" fill="rgba(244,114,182,0.4)" stroke="#f472b6" strokeWidth="1"/>
            <circle cx="16" cy="10" r="3" fill="rgba(236,72,153,0.6)"/>
          </>
        )}
        {symId === 'candy' && (
          <>
            <circle cx="16" cy="16" r="9" fill="rgba(96,165,250,0.3)" stroke="#60a5fa" strokeWidth="1"/>
            <path d="M10 16 Q13 10 16 16 Q19 22 22 16" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </>
        )}
      </svg>
      <span className="text-[8px] font-bold mt-0.5" style={{ color: sym.color }}>{sym.label}</span>
    </div>
  )
}

export default function SlotsGame({ type, onBack }: { type: SlotType; onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [spinning, setSpinning] = useState(false)
  const [grid, setGrid] = useState<string[][]>([
    ['bone','bone','bone'], ['paw','paw','paw'], ['bone','bone','bone'],
    ['paw','paw','paw'], ['bone','bone','bone'],
  ])
  const [winLines, setWinLines] = useState<any[]>([])
  const [totalMultiplier, setTotalMultiplier] = useState(0)
  const [winAmount, setWinAmount] = useState(0)
  const [hasFreeSpin, setHasFreeSpin] = useState(false)
  const [showWin, setShowWin] = useState(false)
  const [reelSpinning, setReelSpinning] = useState([false,false,false,false,false])
  const { initData, updateBalance } = useUserStore()

  const title = type === 'dog' ? 'Dog House' : 'Sugar Rush'
  const symbols = type === 'dog' ? DOG_SYMBOLS : SUGAR_SYMBOLS

  const spin = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter valid bet')
    setSpinning(true)
    setShowWin(false)
    setWinLines([])
    setReelSpinning([true,true,true,true,true])

    try {
      const res = await fetch('/api/games/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
        body: JSON.stringify({ betAmount: amount, game: type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      // Animate reels stopping one by one
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 250))
        setReelSpinning(prev => prev.map((s, idx) => idx === i ? false : s))
      }

      const newGrid = data.grid.map((col: any[]) => col.map((s: any) => s.id))
      setGrid(newGrid)
      setWinLines(data.winLines || [])
      setTotalMultiplier(data.totalMultiplier)
      setWinAmount(data.winAmount)
      setHasFreeSpin(data.hasFreeSpin)
      updateBalance(data.balance)

      if (data.winAmount > 0) {
        setShowWin(true)
        toast.success(`${data.totalMultiplier.toFixed(2)}x — +$${data.winAmount.toFixed(2)}!`)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error')
      setReelSpinning([false,false,false,false,false])
    } finally {
      setSpinning(false)
    }
  }

  const getHighlightedCells = () => {
    const highlighted = new Set<string>()
    winLines.forEach(line => {
      line.positions?.forEach((colIdx: number, i: number) => {
        highlighted.add(`${colIdx}-${i}`)
      })
    })
    return highlighted
  }

  const highlighted = getHighlightedCells()
  const bgGradient = type === 'dog'
    ? 'from-purple-900/60 to-indigo-900/60'
    : 'from-pink-900/60 to-rose-900/60'

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title={title} onBack={onBack} />

      {/* Win display */}
      <AnimatePresence>
        {showWin && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-accent-gold/10 border border-accent-gold/40 rounded-2xl p-3 mb-4 text-center">
            <p className="text-accent-gold font-black text-xl">{totalMultiplier.toFixed(2)}x WIN!</p>
            <p className="text-white font-bold">+${winAmount.toFixed(2)}</p>
            {hasFreeSpin && <p className="text-accent-purpleLight text-sm mt-1">FREE SPIN!</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slots machine */}
      <div className={`bg-gradient-to-b ${bgGradient} border border-bg-border rounded-2xl p-3 mb-4 relative`}>
        {/* Pay lines indicator */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-text-muted">20 lines</span>
          <span className="text-xs text-text-muted">5 reels × 3 rows</span>
        </div>

        {/* Reels */}
        <div className="flex gap-1.5 overflow-hidden rounded-xl bg-bg-primary/50 p-2" style={{ height: 180 }}>
          {Array.from({ length: 5 }).map((_, colIdx) => (
            <div key={colIdx} className="flex-1 flex flex-col gap-1 overflow-hidden">
              {reelSpinning[colIdx] ? (
                <motion.div
                  animate={{ y: ['0%', '-300%', '0%'] }}
                  transition={{ duration: 0.3, repeat: Infinity, ease: 'linear' }}
                  className="flex flex-col gap-1"
                >
                  {[...Array(6)].map((_, i) => {
                    const randSym = symbols[Math.floor(Math.random() * symbols.length)]
                    return (
                      <div key={i} className="h-16 rounded-lg" style={{ background: randSym.bg }}>
                        <svg viewBox="0 0 32 32" fill="none" className="w-full h-full p-2 opacity-60">
                          <circle cx="16" cy="16" r="10" fill={randSym.color + '33'} stroke={randSym.color} strokeWidth="1"/>
                        </svg>
                      </div>
                    )
                  })}
                </motion.div>
              ) : (
                Array.from({ length: 3 }).map((_, rowIdx) => (
                  <motion.div
                    key={rowIdx}
                    initial={false}
                    animate={highlighted.has(`${colIdx}-${rowIdx}`) ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 0.6, repeat: highlighted.has(`${colIdx}-${rowIdx}`) ? Infinity : 0 }}
                    className={`flex-1 rounded-lg border transition-all ${highlighted.has(`${colIdx}-${rowIdx}`) ? 'border-accent-gold' : 'border-bg-border'}`}
                  >
                    <SymbolCell symId={grid[colIdx]?.[rowIdx] || 'bone'} type={type} highlight={highlighted.has(`${colIdx}-${rowIdx}`)}/>
                  </motion.div>
                ))
              )}
            </div>
          ))}
        </div>

        {/* Center line indicator */}
        <div className="absolute left-3 right-3 top-1/2 h-px bg-accent-gold/20 pointer-events-none -translate-y-1" />
      </div>

      {/* Win lines summary */}
      {winLines.length > 0 && (
        <div className="bg-bg-card border border-bg-border rounded-xl p-3 mb-4">
          {winLines.slice(0, 3).map((line, i) => (
            <div key={i} className="flex items-center justify-between text-xs mb-1 last:mb-0">
              <span className="text-text-secondary">{line.count}x {line.symbol}</span>
              <span className="text-accent-gold font-bold">{line.multiplier.toFixed(2)}x</span>
            </div>
          ))}
        </div>
      )}

      <BetInput value={bet} onChange={setBet} />
      <motion.button
        onClick={spin} disabled={spinning}
        whileTap={{ scale: 0.97 }}
        className={`w-full py-4 rounded-2xl text-white font-black text-lg disabled:opacity-40 transition-all
          ${type === 'dog' ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500' : 'bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500'}`}>
        {spinning ? (
          <span className="flex items-center justify-center gap-2">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"/>
            Spinning...
          </span>
        ) : 'SPIN'}
      </motion.button>
    </div>
  )
}
