'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

type Difficulty = 'easy' | 'medium' | 'hard'
type State = 'idle' | 'playing' | 'won' | 'lost'

interface RowState {
  rowIndex: number
  selectedCell: number | null
  revealedMines: boolean[] | null
  safe: boolean | null
}

export default function LadderGame({ onBack }: { onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [state, setState] = useState<State>('idle')
  const [currentRow, setCurrentRow] = useState(0)
  const [totalRows, setTotalRows] = useState(8)
  const [cellCount, setCellCount] = useState(3)
  const [multiplier, setMultiplier] = useState(1)
  const [nextMultiplier, setNextMultiplier] = useState(1)
  const [potentialWin, setPotentialWin] = useState(0)
  const [rowHistory, setRowHistory] = useState<RowState[]>([])
  const [loading, setLoading] = useState(false)
  const [stepLoading, setStepLoading] = useState<number | null>(null)
  const { initData, updateBalance } = useUserStore()
  const headers = { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' }

  const DIFF_CONFIG: Record<Difficulty, { cells: number; mines: number; label: string }> = {
    easy:   { cells: 3, mines: 1, label: 'Easy (1/3)' },
    medium: { cells: 3, mines: 2, label: 'Medium (2/3)' },
    hard:   { cells: 4, mines: 3, label: 'Hard (3/4)' },
  }

  const startGame = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter valid bet')
    setLoading(true)
    try {
      const res = await fetch('/api/games/ladder', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'start', betAmount: amount, difficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCurrentRow(0)
      setTotalRows(data.totalRows)
      setCellCount(data.config.cells)
      setMultiplier(1)
      setNextMultiplier(data.nextMultiplier)
      setPotentialWin(0)
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
      const res = await fetch('/api/games/ladder', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'step', cellIndex }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setRowHistory(prev => [...prev, {
        rowIndex: currentRow,
        selectedCell: cellIndex,
        revealedMines: data.revealedRow,
        safe: !data.hit,
      }])

      if (data.hit) {
        setState('lost')
        toast.error('You hit a trap!')
        updateBalance(data.balance)
      } else if (data.allDone) {
        setState('won')
        setMultiplier(data.multiplier)
        toast.success(`Max win! +$${data.winAmount.toFixed(2)}`)
        updateBalance(data.balance)
      } else {
        setCurrentRow(data.currentRow)
        setMultiplier(data.multiplier)
        setNextMultiplier(data.nextMultiplier)
        setPotentialWin(data.potentialWin)
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
      const res = await fetch('/api/games/ladder', {
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

  const reset = () => { setState('idle'); setRowHistory([]); setCurrentRow(0) }

  const displayRows = totalRows - 1
  const cellColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title="Ladder" onBack={onBack} subtitle="Climb safely to multiply" />

      {/* Stats bar */}
      {state === 'playing' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-between bg-bg-card border border-bg-border rounded-xl px-4 py-2.5 mb-4">
          <div className="text-center">
            <p className="text-xs text-text-muted">Row</p>
            <p className="text-sm font-bold text-white">{currentRow}/{totalRows}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">Multiplier</p>
            <p className="text-sm font-bold text-accent-gold">{multiplier.toFixed(2)}x</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-text-muted">Win now</p>
            <p className="text-sm font-bold text-accent-green">${potentialWin.toFixed(2)}</p>
          </div>
        </motion.div>
      )}

      {/* Ladder grid */}
      {state !== 'idle' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-bg-card border border-bg-border rounded-2xl p-3 mb-4 overflow-hidden">
          {/* Show rows from top, current row highlighted */}
          {Array.from({ length: totalRows }).map((_, rowIdx) => {
            const displayRow = totalRows - 1 - rowIdx
            const historyItem = rowHistory.find(r => r.rowIndex === displayRow)
            const isCurrentRow = state === 'playing' && displayRow === currentRow
            const isPast = displayRow < currentRow
            const isFuture = displayRow > currentRow

            return (
              <div key={displayRow} className={`flex gap-2 mb-1.5 items-center ${isFuture ? 'opacity-40' : ''}`}>
                <span className="text-[10px] text-text-muted w-4 text-right flex-shrink-0">{displayRow + 1}</span>
                {Array.from({ length: cellCount }).map((_, cellIdx) => {
                  const wasMine = historyItem?.revealedMines?.[cellIdx]
                  const wasSelected = historyItem?.selectedCell === cellIdx
                  const isSafe = wasSelected && historyItem?.safe

                  return (
                    <motion.button
                      key={cellIdx}
                      onClick={() => isCurrentRow ? step(cellIdx) : undefined}
                      disabled={!isCurrentRow || stepLoading !== null}
                      whileTap={isCurrentRow ? { scale: 0.9 } : {}}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden
                        ${isCurrentRow
                          ? 'bg-accent-purpleDim border border-accent-purple hover:bg-accent-purple/30 cursor-pointer'
                          : wasMine
                          ? 'bg-red-900/30 border border-red-500/40'
                          : isSafe
                          ? 'bg-green-900/30 border border-green-500/40'
                          : isPast
                          ? 'bg-bg-hover border border-bg-border'
                          : 'bg-bg-hover border border-bg-border'}`}
                    >
                      {isCurrentRow && stepLoading === cellIdx && (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                          className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full"/>
                      )}
                      {isCurrentRow && stepLoading !== cellIdx && (
                        <span className="text-accent-purpleLight">?</span>
                      )}
                      {wasMine && (
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                          <circle cx="8" cy="8" r="5" fill="rgba(239,68,68,0.8)"/>
                          <path d="M8 3V1M8 15V13M3 8H1M15 8H13" stroke="rgba(239,68,68,0.9)" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {isSafe && (
                        <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                          <path d="M3 8L6.5 11.5L13 5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {isPast && !historyItem && (
                        <div className="w-2 h-2 rounded-full bg-bg-border"/>
                      )}
                    </motion.button>
                  )
                })}
                {isCurrentRow && (
                  <motion.div animate={{ x: [0, 4, 0] }} transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-accent-purple flex-shrink-0">
                    <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                      <path d="M4 8H12M12 8L8 4M12 8L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </motion.div>
                )}
              </div>
            )
          })}
        </motion.div>
      )}

      {/* Controls */}
      {state === 'idle' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <BetInput value={bet} onChange={setBet} />
          <div className="grid grid-cols-3 gap-2 mb-4">
            {(Object.keys(DIFF_CONFIG) as Difficulty[]).map(d => (
              <button key={d} onClick={() => setDifficulty(d)}
                className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${difficulty === d ? 'bg-accent-purple border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}>
                {DIFF_CONFIG[d].label}
              </button>
            ))}
          </div>
          <button onClick={startGame} disabled={loading}
            className="w-full py-4 bg-accent-purple rounded-2xl text-white font-bold btn-press disabled:opacity-40">
            {loading ? 'Starting...' : 'Start Game'}
          </button>
        </motion.div>
      )}

      {state === 'playing' && currentRow > 0 && (
        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          onClick={cashOut} disabled={loading}
          className="w-full py-3 bg-accent-gold/20 border border-accent-gold/40 rounded-xl text-accent-gold font-bold btn-press">
          Cash Out ${potentialWin.toFixed(2)} ({multiplier.toFixed(2)}x)
        </motion.button>
      )}

      {(state === 'won' || state === 'lost') && (
        <div className={`rounded-2xl p-4 mb-3 text-center border ${state === 'won' ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
          <p className={`text-2xl font-black ${state === 'won' ? 'text-accent-green' : 'text-accent-red'}`}>
            {state === 'won' ? `${multiplier.toFixed(2)}x WIN!` : 'TRAP HIT!'}
          </p>
        </div>
      )}

      {(state === 'won' || state === 'lost') && (
        <button onClick={reset} className="w-full py-4 bg-bg-card border border-bg-border rounded-2xl text-white font-bold btn-press">
          Play Again
        </button>
      )}
    </div>
  )
}
