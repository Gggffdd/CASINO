'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'
import BetInput from './shared/BetInput'
import GameHeader from './shared/GameHeader'

type Phase = 'waiting' | 'running' | 'crashed'

export default function CrashGame({ onBack }: { onBack: () => void }) {
  const [bet, setBet] = useState('1')
  const [autoCashout, setAutoCashout] = useState('')
  const [phase, setPhase] = useState<Phase>('waiting')
  const [multiplier, setMultiplier] = useState(1)
  const [crashPoint, setCrashPoint] = useState<number | null>(null)
  const [myBet, setMyBet] = useState<{ amount: number; cashedOut: boolean; cashoutMultiplier: number | null } | null>(null)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>()
  const startTimeRef = useRef<number>(0)
  const { initData, updateBalance } = useUserStore()
  const headers = { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' }

  // Poll game state
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/games/crash', { headers: { 'x-telegram-init-data': initData || '' } })
        const data = await res.json()
        if (!res.ok) return

        setPhase(data.phase)
        if (data.phase === 'running') {
          if (!startTimeRef.current) startTimeRef.current = data.startTime || Date.now()
        } else if (data.phase === 'crashed') {
          setCrashPoint(data.crashPoint)
          startTimeRef.current = 0
          if (data.crashPoint) setHistory(prev => [data.crashPoint!, ...prev].slice(0, 10))
        } else {
          startTimeRef.current = 0
          setCrashPoint(null)
          setMultiplier(1)
        }
        if (data.myBet) {
          setMyBet(data.myBet)
          if (data.myBet.cashedOut && data.myBet.cashoutMultiplier) {
            // already handled
          }
        } else {
          setMyBet(null)
        }
      } catch {}
    }, 500)
    return () => clearInterval(poll)
  }, [initData])

  // Animate multiplier
  useEffect(() => {
    if (phase !== 'running') {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }
    const animate = () => {
      if (!startTimeRef.current) { startTimeRef.current = Date.now() }
      const elapsed = Date.now() - startTimeRef.current
      const m = Math.floor(Math.pow(Math.E, 0.00006 * elapsed) * 100) / 100
      setMultiplier(m)
      drawCrashGraph(elapsed, m)
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [phase])

  const drawCrashGraph = (elapsed: number, currentMult: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Background grid
    ctx.strokeStyle = 'rgba(42,42,58,0.5)'
    ctx.lineWidth = 1
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo(0, (H / 4) * i); ctx.lineTo(W, (H / 4) * i); ctx.stroke()
    }
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo((W / 4) * i, 0); ctx.lineTo((W / 4) * i, H); ctx.stroke()
    }

    // Curve
    const maxTime = Math.max(elapsed, 8000)
    const points: [number, number][] = []
    for (let t = 0; t <= elapsed; t += 100) {
      const m = Math.pow(Math.E, 0.00006 * t)
      const x = (t / maxTime) * W
      const y = H - Math.min((Math.log(m) / Math.log(currentMult)) * H * 0.85, H - 10)
      points.push([x, y])
    }

    if (points.length < 2) return

    // Gradient fill
    const grad = ctx.createLinearGradient(0, H, 0, 0)
    grad.addColorStop(0, 'rgba(124,58,237,0.0)')
    grad.addColorStop(1, 'rgba(124,58,237,0.25)')
    ctx.beginPath()
    ctx.moveTo(0, H)
    points.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.lineTo(points[points.length - 1][0], H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // Line
    const lineGrad = ctx.createLinearGradient(0, 0, W, 0)
    lineGrad.addColorStop(0, '#7c3aed')
    lineGrad.addColorStop(1, '#f59e0b')
    ctx.beginPath()
    ctx.moveTo(points[0][0], points[0][1])
    points.forEach(([x, y]) => ctx.lineTo(x, y))
    ctx.strokeStyle = lineGrad
    ctx.lineWidth = 3
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Dot at end
    const [lx, ly] = points[points.length - 1]
    ctx.beginPath()
    ctx.arc(lx, ly, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#f59e0b'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(lx, ly, 10, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(245,158,11,0.3)'
    ctx.fill()
  }

  const placeBet = async () => {
    const amount = parseFloat(bet)
    if (!amount || amount <= 0) return toast.error('Enter valid bet')
    if (phase !== 'waiting') return toast.error('Wait for next round')
    setLoading(true)
    try {
      const res = await fetch('/api/games/crash', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'bet', betAmount: amount, autoCashout: parseFloat(autoCashout) || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.balance)
      toast.success('Bet placed!')
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const cashOut = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/games/crash', {
        method: 'POST', headers,
        body: JSON.stringify({ action: 'cashout' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.balance)
      toast.success(`Cashed out at ${data.multiplier}x! +$${data.winAmount.toFixed(2)}`)
    } catch (e: any) {
      toast.error(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const multColor = multiplier < 1.5 ? 'text-white' : multiplier < 2 ? 'text-accent-gold' : multiplier < 5 ? 'text-accent-green' : 'text-accent-purple'

  return (
    <div className="p-4 max-w-lg mx-auto">
      <GameHeader title="Crash" onBack={onBack} subtitle="Cash out before it crashes!" />

      {/* History pills */}
      <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1">
        {history.map((h, i) => (
          <span key={i} className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${h >= 2 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
            {h.toFixed(2)}x
          </span>
        ))}
      </div>

      {/* Graph */}
      <div className="relative bg-bg-card border border-bg-border rounded-2xl overflow-hidden mb-4" style={{ height: 200 }}>
        <canvas ref={canvasRef} width={600} height={400} className="w-full h-full" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            {phase === 'waiting' && (
              <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-center">
                <p className="text-text-muted text-sm">Waiting for next round...</p>
                <div className="flex gap-1 justify-center mt-2">
                  {[0,1,2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-accent-purple"
                      animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i*0.3 }}/>
                  ))}
                </div>
              </motion.div>
            )}
            {phase === 'running' && (
              <motion.div key="running" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <p className={`text-5xl font-black ${multColor} drop-shadow-lg`}>{multiplier.toFixed(2)}x</p>
              </motion.div>
            )}
            {phase === 'crashed' && (
              <motion.div key="crashed" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center">
                <p className="text-4xl font-black text-accent-red neon-red">{crashPoint?.toFixed(2)}x</p>
                <p className="text-sm text-accent-red mt-1">CRASHED!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* My bet status */}
      {myBet && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl p-3 mb-3 border text-sm ${myBet.cashedOut ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-accent-purpleDim border-accent-purple/30 text-accent-purpleLight'}`}>
          {myBet.cashedOut
            ? `Cashed out at ${myBet.cashoutMultiplier?.toFixed(2)}x — +$${(myBet.amount * (myBet.cashoutMultiplier||1)).toFixed(2)}`
            : `Bet: $${myBet.amount.toFixed(2)} — Potential: $${(myBet.amount * multiplier).toFixed(2)}`}
        </motion.div>
      )}

      {/* Controls */}
      <BetInput value={bet} onChange={setBet} />
      <div className="flex gap-2 mb-3">
        <div className="flex-1 bg-bg-card border border-bg-border rounded-xl px-3 py-2">
          <p className="text-xs text-text-muted mb-1">Auto cash out at</p>
          <input type="number" value={autoCashout} onChange={e => setAutoCashout(e.target.value)}
            placeholder="2.00x" className="w-full bg-transparent text-sm text-white outline-none"/>
        </div>
      </div>

      {phase === 'waiting' && !myBet && (
        <button onClick={placeBet} disabled={loading}
          className="w-full py-4 bg-accent-purple hover:bg-accent-purpleLight disabled:opacity-40 rounded-2xl text-white font-bold btn-press">
          {loading ? 'Placing...' : 'Place Bet'}
        </button>
      )}
      {phase === 'running' && myBet && !myBet.cashedOut && (
        <motion.button onClick={cashOut} disabled={loading}
          animate={{ scale: [1, 1.02, 1] }} transition={{ duration: 0.8, repeat: Infinity }}
          className="w-full py-4 bg-accent-gold/20 border-2 border-accent-gold rounded-2xl text-accent-gold font-black text-lg btn-press">
          CASH OUT {multiplier.toFixed(2)}x
        </motion.button>
      )}
      {(phase === 'waiting' && myBet) && (
        <div className="w-full py-4 bg-bg-card border border-bg-border rounded-2xl text-text-muted font-bold text-center">
          Bet placed — waiting for round to start
        </div>
      )}
    </div>
  )
}
