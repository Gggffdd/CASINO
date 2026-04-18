'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

declare global { interface Window { Telegram?: any } }

export default function AdminPage() {
  const [stats, setStats] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [withdrawals, setWithdrawals] = useState<any[]>([])
  const [tab, setTab] = useState<'stats' | 'users' | 'withdrawals'>('stats')
  const [initData, setInitData] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const tg = window.Telegram?.WebApp
    const data = tg?.initData || ''
    setInitData(data)
    if (data) fetchStats(data)
  }, [])

  const headers = (d?: string) => ({ 'Content-Type': 'application/json', 'x-telegram-init-data': d || initData })

  const fetchStats = async (d?: string) => {
    const res = await fetch('/api/admin?action=stats', { headers: headers(d) })
    if (res.status === 403) { setAuthorized(false); return }
    const data = await res.json()
    if (data.stats) { setStats(data.stats); setAuthorized(true) }
  }

  const fetchUsers = async () => {
    const res = await fetch(`/api/admin?action=users&search=${search}`, { headers: headers() })
    const data = await res.json()
    if (data.users) setUsers(data.users)
  }

  const fetchWithdrawals = async () => {
    const res = await fetch('/api/admin?action=withdrawals', { headers: headers() })
    const data = await res.json()
    if (data.withdrawals) setWithdrawals(data.withdrawals)
  }

  useEffect(() => {
    if (!authorized) return
    if (tab === 'users') fetchUsers()
    if (tab === 'withdrawals') fetchWithdrawals()
  }, [tab, authorized])

  const adminAction = async (action: string, params: any) => {
    await fetch('/api/admin', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({ action, ...params }),
    })
    if (tab === 'users') fetchUsers()
    if (tab === 'withdrawals') fetchWithdrawals()
    fetchStats()
  }

  if (!authorized) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <p className="text-text-muted">Access denied</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-primary p-4">
      <h1 className="text-xl font-black text-white mb-4">Admin Panel</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['stats','users','withdrawals'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all capitalize ${tab === t ? 'bg-accent-purple border-accent-purple text-white' : 'bg-bg-card border-bg-border text-text-secondary'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'stats' && stats && (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Users', value: stats.totalUsers, color: 'text-accent-purpleLight' },
            { label: 'Total Bets', value: stats.totalBets, color: 'text-white' },
            { label: 'Deposits', value: `$${stats.totalDeposits}`, color: 'text-accent-green' },
            { label: 'Withdrawals', value: `$${stats.totalWithdrawals}`, color: 'text-accent-red' },
            { label: 'Profit', value: `$${stats.profit}`, color: 'text-accent-gold' },
            { label: 'Pending W.', value: stats.pendingWithdrawals || 0, color: 'text-accent-gold' },
          ].map(s => (
            <div key={s.label} className="bg-bg-card border border-bg-border rounded-xl p-3">
              <p className="text-xs text-text-muted">{s.label}</p>
              <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex gap-2 mb-3">
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search username..." className="flex-1 bg-bg-card border border-bg-border rounded-xl px-3 py-2 text-sm text-white outline-none"/>
            <button onClick={fetchUsers} className="px-4 py-2 bg-accent-purple rounded-xl text-white text-sm">Search</button>
          </div>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.id} className="bg-bg-card border border-bg-border rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{u.firstName} {u.username ? `@${u.username}` : ''}</p>
                    <p className="text-xs text-text-muted">ID: {u.id}</p>
                  </div>
                  <p className="text-sm font-bold text-accent-gold">${parseFloat(u.balance).toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => adminAction(u.isBanned ? 'unban_user' : 'ban_user', { userId: u.id })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${u.isBanned ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                    {u.isBanned ? 'Unban' : 'Ban'}
                  </button>
                  <button onClick={() => {
                    const amount = prompt('Add balance amount:')
                    if (amount) adminAction('add_balance', { userId: u.id, amount })
                  }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-accent-purpleDim text-accent-purpleLight">
                    Add Balance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'withdrawals' && (
        <div className="space-y-2">
          {withdrawals.length === 0 && <p className="text-text-muted text-sm text-center py-8">No pending withdrawals</p>}
          {withdrawals.map(w => (
            <div key={w.id} className="bg-bg-card border border-bg-border rounded-xl p-3">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{w.user?.firstName} @{w.user?.username}</p>
                  <p className="text-xs text-text-muted">ID: {w.userId}</p>
                </div>
                <p className="text-base font-black text-accent-gold">${parseFloat(w.amount).toFixed(2)} {w.currency}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => adminAction('approve_withdrawal', { withdrawalId: w.id })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-green-900/30 text-green-400">Approve</button>
                <button onClick={() => adminAction('reject_withdrawal', { withdrawalId: w.id, note: 'Rejected by admin' })}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-red-900/30 text-red-400">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
