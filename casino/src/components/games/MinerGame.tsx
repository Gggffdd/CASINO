'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

interface Cell { index: number; revealed: boolean; isMine?: boolean }
type Difficulty = 'easy' | 'medium' | 'hard' | 'extreme'
const MINE_COUNTS: Record<Difficulty, number> = { easy: 3, medium: 8, hard: 15, extreme: 20 }
const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy (3)', medium: 'Medium (8)', hard: 'Hard (15)', extreme: 'Extreme (20)' }

export default function MinerGame({ onBack }: { onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle')
  const [cells, setCells] = useState<Cell[]>([])
  const [multiplier, setMultiplier] = useState(1)
  const [nextMultiplier, setNextMultiplier] = useState(1)
  const [potentialWin, setPotentialWin] = useState(0)
  const [betId, setBetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [revealLoading, setRevealLoading] = useState<number | null>(null)
  const { initData, updateBalance } = useUserStore()

  const headers = { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' }

  const startGame = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter a valid bet')
    setLoading(true)
    try {
      const res = await fetch('/api/games/miner', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'start', betAmount: amount, difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCells(Array.from({ length: 25 }, (_, i) => ({ index: i, revealed: false })))
      setMultiplier(1)
      setNextMultiplier(data.currentMultiplier)
      setPotentialWin(0)
      setBetId(data.betId)
      setGameState('playing')
      updateBalance(data.balance)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const revealCell = async (idx: number) => {
    if (gameState !== 'playing' || cells[idx].revealed || revealLoading !== null) return
    setRevealLoading(idx)
    try {
      const res = await fetch('/api/games/miner', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'reveal', cellIndex: idx }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.hit) {
        setCells(data.grid)
        setGameState('lost')
        toast.error('BOOM! You hit a mine!')
        updateBalance(data.balance)
      } else if (data.allRevealed) {
        setCells(prev => prev.map(c => c.index === idx ? { ...c, revealed: true } : c))
        setMultiplier(data.multiplier)
        setGameState('won')
        toast.success(`You won $${data.winAmount.toFixed(2)}!`)
        updateBalance(data.balance)
      } else {
        setCells(prev => prev.map(c => c.index === idx ? { ...c, revealed: true, isMine: false } : c))
        setMultiplier(data.multiplier)
        setNextMultiplier(data.nextMultiplier)
        setPotentialWin(data.potentialWin)
      }
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setRevealLoading(null)
    }
  }

  const cashOut = async () => {
    if (gameState !== 'playing') return
    setLoading(true)
    try {
      const res = await fetch('/api/games/miner', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'cashout' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCells(data.grid)
      setMultiplier(data.multiplier)
      setGameState('won')
      toast.success(`Cashed out: $${data.winAmount.toFixed(2)}!`)
      updateBalance(data.balance)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setGameState('idle'); setCells([]); setMultiplier(1); setPotentialWin(0) }

  const revealedCount = cells.filter(c => c.revealed && !c.isMine).length

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title="Miner" onBack={onBack} />

      {/* Multiplier display */}
      <motion.div
        className={`rounded-2xl p-4 mb-4 text-center border ${gameState === 'lost' ? 'bg-red-900/20 border-red-500/30' : gameState === 'won' ? 'bg-green-900/20 border-green-500/30' : 'bg-bg-card border-bg-border'}`}
        animate={gameState === 'lost' ? { x: [-4,4,-4,4,0] } : {}}
        transition={{ duration: 0.4 }}
      >
        {gameState === 'playing' ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted">Current</p>
              <p className="text-2xl font-black text-white">{multiplier.toFixed(2)}x</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">Potential win</p>
              <p className="text-xl font-bold text-accent-gold">${potentialWin.toFixed(2)}</p>
            </div>
          </div>
        ) : gameState === 'lost' ? (
          <p className="text-xl font-black text-accent-red neon-red">MINE HIT!</p>
        ) : gameState === 'won' ? (
          <p className="text-xl font-black text-accent-green neon-green">{multiplier.toFixed(2)}x WIN!</p>
        ) : (
          <p className="text-sm text-text-muted">Choose difficulty and start</p>
        )}
      </motion.div>

      {/* Grid */}
      {gameState !== 'idle' && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-4">
          <div className="grid grid-cols-5 gap-2 mb-3">
            {cells.map((cell, i) => (
              <motion.button
                key={i}
                onClick={() => revealCell(i)}
                disabled={cell.revealed || gameState !== 'playing'}
                whileTap={{ scale: 0.9 }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.01 }}
                className={`aspect-square rounded-xl flex items-center justify-center transition-all relative overflow-hidden ${
                  !cell.revealed
                    ? 'bg-bg-hover border border-bg-border hover:border-accent-purple hover:bg-accent-purpleDim active:scale-95'
                    : cell.isMine
                    ? 'bg-red-900/40 border border-red-500/50'
                    : 'bg-green-900/30 border border-green-500/30'
                }`}
              >
                {revealLoading === i && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full"
                  />
                )}
                {cell.revealed && cell.isMine && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-6 h-6">
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="7" fill="rgba(239,68,68,0.8)"/>
                      <path d="M12 5V3M12 21V19M5 12H3M21 12H19M7.05 7.05L5.64 5.64M18.36 18.36L16.95 16.95M16.95 7.05L18.36 5.64M5.64 18.36L7.05 16.95" stroke="rgba(239,68,68,0.9)" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                )}
                {cell.revealed && !cell.isMine && (
                  <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} className="w-5 h-5">
                    <svg viewBox="0 0 20 20" fill="none">
                      <path d="M4 10L8 14L16 6" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.div>
                )}
                {!cell.revealed && revealLoading !== i && (
                  <div className="w-3 h-3 rounded-full bg-bg-border opacity-50"/>
                )}
              </motion.button>
            ))}
          </div>
          {gameState === 'playing' && revealedCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              onClick={cashOut}
              disabled={loading}
              className="w-full py-3 bg-accent-gold/20 border border-accent-gold/40 rounded-xl text-accent-gold font-bold btn-press"
            >
              Cash Out ${potentialWin.toFixed(2)} ({multiplier.toFixed(2)}x)
            </motion.button>
          )}
        </motion.div>
      )}

      {/* Controls */}
      {gameState === 'idle' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <BetInput value={bet} onChange={setBet} />
          <div className="grid grid-cols-4 gap-1.5 mb-4">
            {(Object.keys(DIFF_LABELS) as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${difficulty === d ? 'bg-accent-purple border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}>
                {d.charAt(0).toUpperCase() + d.slice(1)}
                <br/><span className="text-[10px] opacity-70">{MINE_COUNTS[d]} mines</span>
              </button>
            ))}
          </div>
          <button onClick={startGame} disabled={loading}
            className="w-full py-4 bg-accent-purple hover:bg-accent-purpleLight disabled:opacity-40 rounded-2xl text-white font-bold btn-press">
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </motion.div>
      )}

      {(gameState === 'won' || gameState === 'lost') && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={reset}
          className="w-full py-4 bg-bg-card border border-bg-border rounded-2xl text-white font-bold btn-press mt-2">
          Play Again
        </motion.button>
      )}
    </div>
  )
}
