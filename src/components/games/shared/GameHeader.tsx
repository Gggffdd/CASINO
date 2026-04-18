'use client'
import { useUserStore } from '@/hooks/useUser'

export default function GameHeader({ title, onBack, subtitle }: { title: string; onBack: () => void; subtitle?: string }) {
  const user = useUserStore(s => s.user)
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-xl bg-bg-card border border-bg-border flex items-center justify-center btn-press">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path d="M13 4L7 10L13 16" stroke="#a0a0b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
        <div>
          <h2 className="text-lg font-black text-white">{title}</h2>
          {subtitle && <p className="text-xs text-text-muted">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-bg-card border border-bg-border rounded-xl px-3 py-1.5">
        <span className="text-xs font-bold text-white font-mono">{parseFloat(user?.balance||'0').toFixed(2)}</span>
        <span className="text-xs text-text-muted">USDT</span>
      </div>
    </div>
  )
}
