'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

type Choice = 'heads' | 'tails'
type State = 'idle' | 'flipping' | 'result'

export default function CoinflipGame({ onBack }: { onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [choice, setChoice] = useState<Choice>('heads')
  const [state, setState] = useState<State>('idle')
  const [result, setResult] = useState<{ won: boolean; result: Choice; winAmount: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [streak, setStreak] = useState(0)
  const { initData, updateBalance } = useUserStore()

  const flip = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter valid bet')
    setLoading(true)
    setState('flipping')
    setResult(null)
    try {
      const res = await fetch('/api/games/coinflip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
        body: JSON.stringify({ betAmount: amount, choice }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Wait for animation
      await new Promise(r => setTimeout(r, 1200))
      setResult({ won: data.won, result: data.result, winAmount: data.winAmount })
      setState('result')
      updateBalance(data.balance)
      setStreak(prev => data.won ? prev + 1 : 0)
      if (data.won) toast.success(`+$${data.winAmount.toFixed(2)}`)
      else toast.error('Better luck next time!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
      setState('idle')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title="Coinflip" onBack={onBack} subtitle="50/50 · 1.94x payout" />

      {/* Streak */}
      {streak > 1 && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-accent-gold/10 border border-accent-gold/30 rounded-xl px-4 py-2 mb-4 text-center">
          <p className="text-accent-gold font-bold text-sm">{streak}x Win Streak!</p>
        </motion.div>
      )}

      {/* Coin */}
      <div className="flex justify-center items-center my-8">
        <div className="relative" style={{ perspective: 1000 }}>
          <motion.div
            animate={state === 'flipping' ? { rotateY: [0, 360, 720, 1080, 1440, 1800] } : { rotateY: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            style={{ transformStyle: 'preserve-3d' }}
            className="w-32 h-32"
          >
            {/* Heads side */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}>
              <svg viewBox="0 0 128 128" fill="none" className="w-full h-full drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]">
                <circle cx="64" cy="64" r="60" fill="url(#headGrad)" stroke="rgba(245,158,11,0.4)" strokeWidth="2"/>
                <circle cx="64" cy="64" r="52" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                <text x="64" y="75" textAnchor="middle" fontSize="36" fontWeight="900" fill="rgba(255,255,255,0.9)" fontFamily="serif">$</text>
                <defs>
                  <radialGradient id="headGrad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#fbbf24"/>
                    <stop offset="60%" stopColor="#f59e0b"/>
                    <stop offset="100%" stopColor="#b45309"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
            {/* Tails side */}
            <div className="absolute inset-0 rounded-full flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <svg viewBox="0 0 128 128" fill="none" className="w-full h-full drop-shadow-[0_0_20px_rgba(124,58,237,0.6)]">
                <circle cx="64" cy="64" r="60" fill="url(#tailGrad)" stroke="rgba(124,58,237,0.4)" strokeWidth="2"/>
                <circle cx="64" cy="64" r="52" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                <text x="64" y="75" textAnchor="middle" fontSize="28" fontWeight="900" fill="rgba(255,255,255,0.9)">R</text>
                <defs>
                  <radialGradient id="tailGrad" cx="40%" cy="35%">
                    <stop offset="0%" stopColor="#9d5cf6"/>
                    <stop offset="60%" stopColor="#7c3aed"/>
                    <stop offset="100%" stopColor="#4c1d95"/>
                  </radialGradient>
                </defs>
              </svg>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Result */}
      <AnimatePresence>
        {state === 'result' && result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-2xl p-4 mb-4 text-center border ${result.won ? 'bg-green-900/20 border-green-500/30' : 'bg-red-900/20 border-red-500/30'}`}>
            <p className="text-sm text-text-muted mb-1">{result.result === 'heads' ? 'Heads' : 'Tails'}</p>
            <p className={`text-2xl font-black ${result.won ? 'text-accent-green' : 'text-accent-red'}`}>
              {result.won ? `+$${result.winAmount.toFixed(2)}` : 'No luck!'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Choice buttons */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {(['heads', 'tails'] as Choice[]).map(c => (
          <button key={c} onClick={() => setChoice(c)}
            className={`py-4 rounded-2xl font-bold text-sm border transition-all btn-press flex flex-col items-center gap-1
              ${choice === c
                ? c === 'heads' ? 'bg-amber-900/30 border-amber-500 text-amber-400' : 'bg-purple-900/30 border-purple-500 text-purple-400'
                : 'bg-bg-card border-bg-border text-text-secondary'}`}>
            <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
              {c === 'heads' ? (
                <>
                  <circle cx="16" cy="16" r="14" fill={choice===c ? 'rgba(245,158,11,0.3)' : 'rgba(42,42,58,0.5)'} stroke={choice===c ? '#f59e0b' : '#3a3a4a'} strokeWidth="1.5"/>
                  <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="bold" fill={choice===c ? '#f59e0b' : '#6b6b85'}>$</text>
                </>
              ) : (
                <>
                  <circle cx="16" cy="16" r="14" fill={choice===c ? 'rgba(124,58,237,0.3)' : 'rgba(42,42,58,0.5)'} stroke={choice===c ? '#7c3aed' : '#3a3a4a'} strokeWidth="1.5"/>
                  <text x="16" y="21" textAnchor="middle" fontSize="10" fontWeight="bold" fill={choice===c ? '#9d5cf6' : '#6b6b85'}>R</text>
                </>
              )}
            </svg>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      <BetInput value={bet} onChange={setBet} />

      <button onClick={flip} disabled={loading || state === 'flipping'}
        className="w-full py-4 bg-accent-purple hover:bg-accent-purpleLight disabled:opacity-40 rounded-2xl text-white font-bold btn-press">
        {state === 'flipping' ? 'Flipping...' : 'Flip Coin'}
      </button>
      {state === 'result' && (
        <button onClick={() => setState('idle')} className="w-full py-3 mt-2 bg-bg-card border border-bg-border rounded-2xl text-text-secondary font-medium btn-press">
          Flip Again
        </button>
      )}
    </div>
  )
}
