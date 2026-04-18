'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
type State = 'idle' | 'playing' | 'won' | 'lost'

const DIFF_CONFIG: Record<Difficulty, { cols: number; label: string; color: string }> = {
  easy:    { cols: 4, label: 'Easy (4 cols)', color: '#10b981' },
  medium:  { cols: 3, label: 'Medium (3 cols)', color: '#3b82f6' },
  hard:    { cols: 2, label: 'Hard (2 cols)', color: '#f59e0b' },
  extreme: { cols: 1, label: 'Extreme (1 col)', color: '#ef4444' },
}

export default function TowerGame({ onBack }: { onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [state, setState] = useState<State>('idle')
  const [currentRow, setCurrentRow] = useState(0)
  const [totalRows, setTotalRows] = useState(12)
  const [cols, setCols] = useState(3)
  const [multiplier, setMultiplier] = useState(1)
  const [nextMultiplier, setNextMultiplier] = useState(1)
  const [loading, setLoading] = useState(false)
  const [stepLoading, setStepLoading] = useState<number | null>(null)
  const [rowHistory, setRowHistory] = useState<{ row: number; selected: number; mines: boolean[] }[]>([])
  const { initData, updateBalance } = useUserStore()
  const headers = { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' }

  const startGame = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter valid bet')
    setLoading(true)
    try {
      const res = await fetch('/api/games/tower', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'start', betAmount: amount, difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentRow(0)
      setTotalRows(data.totalRows)
      setCols(data.config.cols)
      setMultiplier(1)
      setNextMultiplier(data.nextMultiplier)
      setRowHistory([])
      setState('playing')
      updateBalance(data.balance)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const step = async (cellIndex: number) => {
    if (state !== 'playing' || stepLoading !== null) return
    setStepLoading(cellIndex)
    try {
      const res = await fetch('/api/games/tower', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'step', cellIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setRowHistory(prev => [...prev, { row: currentRow, selected: cellIndex, mines: data.revealedRow }])

      if (data.hit) {
        setState('lost')
        toast.error('Bomb! Floor collapsed!')
        updateBalance(data.balance)
      } else if (data.allDone) {
        setState('won')
        setMultiplier(data.multiplier)
        toast.success(`Tower conquered! +$${data.winAmount.toFixed(2)}`)
        updateBalance(data.balance)
      } else {
        setCurrentRow(data.currentRow)
        setMultiplier(data.multiplier)
        setNextMultiplier(data.nextMultiplier)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setStepLoading(null)
    }
  }

  const cashOut = async () => {
    if (state !== 'playing' || currentRow === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/games/tower', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'cashout' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMultiplier(data.multiplier)
      setState('won')
      toast.success(`Cashed out $${data.winAmount.toFixed(2)}!`)
      updateBalance(data.balance)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const VISIBLE_ROWS = Math.min(8, totalRows)

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title="Tower" onBack={onBack} subtitle="Reach the top for max multiplier" />

      {/* Multiplier display */}
      {state === 'playing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex gap-3 mb-4">
          <div className="flex-1 bg-bg-card border border-bg-border rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Current</p>
            <p className="text-xl font-black text-white">{multiplier.toFixed(2)}x</p>
          </div>
          <div className="flex-1 bg-accent-purpleDim border border-accent-purple/40 rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Next floor</p>
            <p className="text-xl font-black text-accent-purpleLight">{nextMultiplier.toFixed(2)}x</p>
          </div>
          <div className="flex-1 bg-bg-card border border-bg-border rounded-xl p-3 text-center">
            <p className="text-xs text-text-muted">Floor</p>
            <p className="text-xl font-black text-accent-gold">{currentRow}/{totalRows}</p>
          </div>
        </motion.div>
      )}

      {/* Tower visual */}
      {state !== 'idle' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card border border-bg-border rounded-2xl p-3 mb-4">
          {Array.from({ length: VISIBLE_ROWS }).map((_, i) => {
            const rowIdx = totalRows - 1 - i
            const hist = rowHistory.find(r => r.row === rowIdx)
            const isActive = state === 'playing' && rowIdx === currentRow
            const isPast = rowIdx < currentRow
            const isFuture = rowIdx > currentRow

            return (
              <div key={rowIdx} className={`flex gap-2 mb-2 items-center ${isFuture ? 'opacity-30' : ''}`}>
                <div className={`w-6 text-[10px] text-center flex-shrink-0 font-mono ${isActive ? 'text-accent-purple' : 'text-text-muted'}`}>
                  {rowIdx + 1}
                </div>
                {Array.from({ length: cols }).map((_, cIdx) => {
                  const wasMine = hist?.mines?.[cIdx]
                  const wasSelected = hist?.selected === cIdx
                  const isSafe = wasSelected && !wasMine

                  return (
                    <motion.button
                      key={cIdx}
                      onClick={() => isActive ? step(cIdx) : undefined}
                      disabled={!isActive || stepLoading !== null}
                      whileTap={isActive ? { scale: 0.88 } : {}}
                      className={`flex-1 h-11 rounded-xl flex items-center justify-center transition-all
                        ${isActive
                          ? 'bg-gradient-to-b from-accent-purple/30 to-accent-purple/10 border border-accent-purple hover:from-accent-purple/50 cursor-pointer'
                          : isSafe
                          ? 'bg-green-900/30 border border-green-500/30'
                          : wasMine
                          ? 'bg-red-900/30 border border-red-500/30'
                          : 'bg-bg-hover border border-bg-border'
                        }`}
                    >
                      {isActive && stepLoading === cIdx && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full"/>
                      )}
                      {isActive && stepLoading !== cIdx && (
                        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                          <path d="M10 3V17M4 11L10 17L16 11" stroke="rgba(157,92,246,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {isSafe && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                            <circle cx="10" cy="10" r="8" fill="rgba(16,185,129,0.2)"/>
                            <path d="M6 10L9 13L14 7" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </motion.div>
                      )}
                      {wasMine && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
                            <circle cx="10" cy="10" r="6" fill="rgba(239,68,68,0.6)"/>
                            <path d="M7 7L13 13M13 7L7 13" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  )
                })}
                {isActive && (
                  <div className="w-5 flex-shrink-0">
                    <motion.div animate={{ x: [0, 3, 0] }} transition={{ duration: 0.6, repeat: Infinity }}
                      className="w-1 h-11 rounded-full bg-accent-purple"/>
                  </div>
                )}
              </div>
            )
          })}
          {totalRows > VISIBLE_ROWS && (
            <p className="text-center text-xs text-text-muted mt-1">... {totalRows - VISIBLE_ROWS} more floors</p>
          )}
        </motion.div>
      )}

      {/* Bottom controls */}
      {state === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <BetInput value={bet} onChange={setBet} />
          <div className="grid grid-cols-2 gap-2 mb-4">
            {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${difficulty === d ? 'border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}
                style={difficulty === d ? { background: DIFF_CONFIG[d].color + '33', borderColor: DIFF_CONFIG[d].color, color: DIFF_CONFIG[d].color } : {}}>
                {DIFF_CONFIG[d].label}
              </button>
            ))}
          </div>
          <button onClick={startGame} disabled={loading}
            className="w-full py-4 bg-accent-purple rounded-2xl text-white font-bold btn-press disabled:opacity-40">
            {loading ? 'Starting...' : 'Start Climbing'}
          </button>
        </motion.div>
      )}

      {state === 'playing' && currentRow > 0 && (
        <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          onClick={cashOut} disabled={loading}
          className="w-full py-3 bg-accent-gold/20 border border-accent-gold/40 rounded-xl text-accent-gold font-bold btn-press">
          Cash Out ({multiplier.toFixed(2)}x)
        </motion.button>
      )}

      {(state === 'won' || state === 'lost') && (
        <>
          <div className={`rounded-2xl p-4 mb-3 text-center border ${state === 'won' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <p className={`text-2xl font-black ${state === 'won' ? 'text-accent-green' : 'text-accent-red'}`}>
              {state === 'won' ? `${multiplier.toFixed(2)}x WIN!` : 'BOMB!'}
            </p>
          </div>
          <button onClick={() => { setState('idle'); setRowHistory([]); setCurrentRow(0) }}
            className="w-full py-4 bg-bg-card border border-bg-border rounded-2xl text-white font-bold btn-press">
            Play Again
          </button>
        </>
      )}
    </div>
  )
}
