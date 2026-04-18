'use client'
import { useEffect, useState } from 'react'
import { useUserStore } from '@/hooks/useUser'

export default function ProfileTab() {
  const { user } = useUserStore()
  const [bets, setBets] = useState<any[]>([])
  const { initData } = useUserStore()

  useEffect(() => {
    fetch('/api/auth', { headers: { 'x-telegram-init-data': initData || '' } })
      .then(r => r.json()).then(d => { if (d.recentBets) setBets(d.recentBets) })
  }, [])

  const gameLabel: Record<string, string> = {
    MINER: 'Miner', CRASH: 'Crash', COINFLIP: 'Coinflip',
    LADDER: 'Ladder', TOWER: 'Tower', SLOTS_DOG: 'Dog House', SLOTS_SUGAR: 'Sugar Rush',
  }

  const stats = [
    { label: 'Total Bets', value: bets.length },
    { label: 'Won', value: bets.filter(b => ['WON','CASHOUT'].includes(b.status)).length, color: 'text-accent-green' },
    { label: 'Lost', value: bets.filter(b => b.status === 'LOST').length, color: 'text-accent-red' },
  ]

  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-14 h-14 rounded-2xl bg-accent-purpleDim flex items-center justify-center">
          <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
            <circle cx="16" cy="12" r="6" fill="rgba(157,92,246,0.8)"/>
            <path d="M4 28C4 22.5 9.4 18 16 18C22.6 18 28 22.5 28 28" stroke="rgba(157,92,246,0.8)" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{user?.firstName || 'Player'}</p>
          {user?.username && <p className="text-sm text-text-muted">@{user.username}</p>}
          <p className="text-xs text-text-muted mt-0.5">ID: {user?.id}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map(s => (
          <div key={s.label} className="bg-bg-card border border-bg-border rounded-xl p-3 text-center">
            <p className={`text-lg font-black ${s.color || 'text-white'}`}>{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Recent Bets</h3>
      {bets.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">No bets yet — start playing!</div>
      ) : (
        <div className="space-y-2">
          {bets.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-bg-card border border-bg-border rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">{gameLabel[b.game] || b.game}</p>
                <p className="text-xs text-text-muted">Bet: ${parseFloat(b.betAmount).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${['WON','CASHOUT'].includes(b.status) ? 'text-accent-green' : 'text-accent-red'}`}>
                  {['WON','CASHOUT'].includes(b.status) ? `+${parseFloat(b.winAmount).toFixed(2)}` : `-${parseFloat(b.betAmount).toFixed(2)}`}
                </p>
                <p className="text-xs text-text-muted">{b.multiplier}x</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
