'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUserStore } from '@/hooks/useUser'
import toast from 'react-hot-toast'

type WalletView = 'main' | 'deposit' | 'withdraw'

export default function WalletTab() {
  const [view, setView] = useState<WalletView>('main')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<'USDT' | 'TON'>('USDT')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[]>([])
  const { user, initData, updateBalance } = useUserStore()

  useEffect(() => {
    fetch('/api/payments/deposit', { headers: { 'x-telegram-init-data': initData || '' } })
      .then(r => r.json()).then(d => { if (d.deposits) setHistory(d.deposits) })
  }, [])

  const handleDeposit = async () => {
    const num = parseFloat(amount)
    if (!num || num < 1) return toast.error('Minimum deposit: 1 USDT')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
        body: JSON.stringify({ amount: num, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      // Open CryptoBot invoice
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.openLink(data.invoiceUrl)
      } else {
        window.open(data.invoiceUrl, '_blank')
      }
      toast.success('Invoice created! Complete payment in CryptoBot')
      setView('main')
      setAmount('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to create invoice')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const num = parseFloat(amount)
    if (!num || num < 2) return toast.error('Minimum withdrawal: 2 USDT')
    if (num > parseFloat(user?.balance || '0')) return toast.error('Insufficient balance')
    setLoading(true)
    try {
      const res = await fetch('/api/payments/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-telegram-init-data': initData || '' },
        body: JSON.stringify({ amount: num, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      updateBalance(data.balance)
      toast.success('Withdrawal processed!')
      setView('main')
      setAmount('')
    } catch (e: any) {
      toast.error(e.message || 'Failed to withdraw')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = ['5', '10', '25', '50', '100']

  if (view === 'deposit' || view === 'withdraw') {
    const isDeposit = view === 'deposit'
    return (
      <div className="p-4 max-w-lg mx-auto">
        <button onClick={() => setView('main')} className="flex items-center gap-2 text-text-secondary mb-5">
          <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
            <path d="M13 4L7 10L13 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Back
        </button>
        <h2 className="text-xl font-bold text-white mb-5">{isDeposit ? 'Deposit' : 'Withdraw'}</h2>

        {/* Currency selector */}
        <div className="flex gap-2 mb-4">
          {(['USDT', 'TON'] as const).map(c => (
            <button key={c} onClick={() => setCurrency(c)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${currency === c ? 'bg-accent-purple border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Amount input */}
        <div className="bg-bg-card border border-bg-border rounded-2xl p-4 mb-4">
          <label className="text-xs text-text-muted mb-2 block">Amount ({currency})</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-2xl font-bold text-white outline-none"
          />
          {currency === 'TON' && amount && (
            <p className="text-xs text-text-muted mt-1">≈ {(parseFloat(amount) * 3.5).toFixed(2)} USDT</p>
          )}
        </div>

        {/* Quick amounts */}
        <div className="flex gap-2 mb-5">
          {quickAmounts.map(q => (
            <button key={q} onClick={() => setAmount(q)}
              className="flex-1 py-1.5 bg-bg-card border border-bg-border rounded-lg text-xs text-text-secondary hover:border-accent-purple transition-all">
              {q}
            </button>
          ))}
        </div>

        {isDeposit && (
          <div className="bg-bg-card border border-bg-border rounded-xl p-3 mb-5">
            <p className="text-xs text-text-muted">Minimum: 1 USDT | Instant confirmation</p>
            <p className="text-xs text-text-muted mt-1">Payment via CryptoBot</p>
          </div>
        )}

        <button
          onClick={isDeposit ? handleDeposit : handleWithdraw}
          disabled={loading || !amount}
          className="w-full py-4 bg-accent-purple hover:bg-accent-purpleLight disabled:opacity-40 rounded-2xl text-white font-bold text-base transition-all btn-press"
        >
          {loading ? 'Processing...' : isDeposit ? `Deposit ${amount || '0'} ${currency}` : `Withdraw ${amount || '0'} USDT`}
        </button>
      </div>
    )
  }

  const balance = parseFloat(user?.balance || '0')
  return (
    <div className="p-4 max-w-lg mx-auto">
      {/* Balance card */}
      <div className="bg-gradient-to-br from-purple-900 via-violet-800/80 to-purple-900/60 rounded-2xl p-5 mb-5 border border-purple-700/30">
        <p className="text-sm text-purple-300 mb-1">Total Balance</p>
        <p className="text-3xl font-black text-white">{balance.toFixed(2)} <span className="text-lg text-purple-300">USDT</span></p>
        <div className="flex gap-4 mt-3">
          <div>
            <p className="text-xs text-purple-300">Deposited</p>
            <p className="text-sm font-bold text-white">{parseFloat(user?.totalDeposit || '0').toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-purple-300">Won</p>
            <p className="text-sm font-bold text-accent-green">{parseFloat(user?.totalWon || '0').toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-purple-300">Lost</p>
            <p className="text-sm font-bold text-accent-red">{parseFloat(user?.totalLost || '0').toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <button onClick={() => setView('deposit')} className="flex items-center justify-center gap-2 bg-accent-green/10 border border-accent-green/30 rounded-2xl py-4 btn-press">
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M10 3V17M4 11L10 17L16 11" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-accent-green font-semibold">Deposit</span>
        </button>
        <button onClick={() => setView('withdraw')} className="flex items-center justify-center gap-2 bg-accent-purple/10 border border-accent-purple/30 rounded-2xl py-4 btn-press">
          <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
            <path d="M10 17V3M4 9L10 3L16 9" stroke="#9d5cf6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="text-accent-purpleLight font-semibold">Withdraw</span>
        </button>
      </div>

      {/* History */}
      <h3 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wider">Recent Deposits</h3>
      {history.length === 0 ? (
        <div className="text-center py-8 text-text-muted text-sm">No deposits yet</div>
      ) : (
        <div className="space-y-2">
          {history.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between bg-bg-card border border-bg-border rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white font-medium">{parseFloat(d.amountUSDT).toFixed(2)} USDT</p>
                <p className="text-xs text-text-muted">{new Date(d.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${d.status === 'COMPLETED' ? 'bg-green-900/30 text-green-400' : d.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'}`}>
                {d.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
