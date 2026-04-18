'use client'
import { useUserStore } from '@/hooks/useUser'

const QUICK = ['0.5', '1', '2', '5', '10', '25']

export default function BetInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const user = useUserStore(s => s.user)
  const max = parseFloat(user?.balance || '0')

  return (
    <div className="mb-4">
      <div className="bg-bg-card border border-bg-border rounded-2xl p-3 mb-2">
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-text-muted">Bet Amount (USDT)</label>
          <button onClick={() => onChange(max.toFixed(2))} className="text-xs text-accent-purple">MAX</button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number" value={value} onChange={e => onChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 bg-transparent text-xl font-bold text-white outline-none"
          />
          <div className="flex gap-1">
            <button onClick={() => onChange((parseFloat(value||'0')/2).toFixed(2))} className="text-xs px-2 py-1 bg-bg-hover rounded-lg text-text-secondary">1/2</button>
            <button onClick={() => onChange((parseFloat(value||'0')*2).toFixed(2))} className="text-xs px-2 py-1 bg-bg-hover rounded-lg text-text-secondary">2x</button>
          </div>
        </div>
      </div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {QUICK.map(q => (
          <button key={q} onClick={() => onChange(q)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${value === q ? 'bg-accent-purple border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}>
            ${q}
          </button>
        ))}
      </div>
    </div>
  )
}
