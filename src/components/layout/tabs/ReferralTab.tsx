'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'

export default function ReferralTab() {
  const [data, setData] = useState<any>(null)
  const { initData } = useUserStore()

  useEffect(() => {
    fetch('/api/referral', { headers: { 'x-telegram-init-data': initData || '' } })
      .then(r => r.json()).then(d => setData(d))
  }, [])

  const copyLink = () => {
    if (data?.referralLink) {
      navigator.clipboard.writeText(data.referralLink).then(() => toast.success('Link copied!'))
    }
  }

  const shareLink = () => {
    if (window.Telegram?.WebApp && data?.referralLink) {
      window.Telegram.WebApp.openLink(`https://t.me/share/url?url=${encodeURIComponent(data.referralLink)}&text=${encodeURIComponent('Join Royal Casino and get bonuses!')}`)
    }
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-white mb-2">Referral Program</h2>
      <p className="text-sm text-text-secondary mb-5">Earn <span className="text-accent-gold font-bold">5% commission</span> from every bet your referrals make</p>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'Referrals', value: data?.referralCount || 0, color: 'text-accent-purpleLight' },
          { label: 'Earned', value: `$${data?.totalEarned || '0.00'}`, color: 'text-accent-gold' },
          { label: 'Active', value: data?.referrals?.filter((r: any) => r.deposited).length || 0, color: 'text-accent-green' },
        ].map(s => (
          <div key={s.label} className="bg-bg-card border border-bg-border rounded-xl p-3 text-center">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-4 mb-4">
        <p className="text-xs text-text-muted mb-2">Your referral link</p>
        <p className="text-xs text-text-secondary font-mono bg-bg-primary rounded-lg px-3 py-2 break-all mb-3">
          {data?.referralLink || 'Loading...'}
        </p>
        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 py-2.5 bg-bg-primary border border-bg-border rounded-xl text-sm text-text-secondary btn-press">
            Copy
          </button>
          <button onClick={shareLink} className="flex-1 py-2.5 bg-accent-purple rounded-xl text-sm text-white font-semibold btn-press">
            Share
          </button>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-bg-card border border-bg-border rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-bold text-white mb-3">How it works</h3>
        {[
          { step: '1', text: 'Share your referral link with friends' },
          { step: '2', text: 'They sign up and make a deposit' },
          { step: '3', text: 'You earn 5% from every bet they place' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-3 mb-2 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-accent-purple flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5">{s.step}</span>
            <p className="text-sm text-text-secondary">{s.text}</p>
          </div>
        ))}
      </div>

      {/* Recent earnings */}
      {data?.recentEarnings?.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Recent Earnings</h3>
          <div className="space-y-2">
            {data.recentEarnings.slice(0, 10).map((e: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-bg-card border border-bg-border rounded-xl px-4 py-2.5">
                <p className="text-sm text-text-secondary">Commission earned</p>
                <p className="text-sm font-bold text-accent-gold">+{parseFloat(e.amount).toFixed(4)} USDT</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
