export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

export interface UserData {
  id: number
  username: string | null
  firstName: string | null
  lastName: string | null
  balance: string
  totalDeposit: string
  totalWithdraw: string
  totalWon: string
  totalLost: string
  referralCode: string
  referredBy: number | null
  isBanned: boolean
  isAdmin: boolean
  createdAt: string
}

export type GameType = 'MINER' | 'CRASH' | 'COINFLIP' | 'LADDER' | 'TOWER' | 'SLOTS_DOG' | 'SLOTS_SUGAR'

export interface BetRecord {
  id: string
  game: GameType
  betAmount: string
  winAmount: string
  multiplier: string
  status: 'PENDING' | 'WON' | 'LOST' | 'CASHOUT'
  createdAt: string
}

// Miner Game
export interface MinerCell {
  index: number
  revealed: boolean
  isMine: boolean
}

export interface MinerGameState {
  betId: string
  grid: MinerCell[]
  betAmount: number
  rows: number
  cols: number
  mines: number
  revealed: number[]
  currentMultiplier: number
  status: 'playing' | 'won' | 'lost' | 'cashed_out'
}

// Crash Game
export interface CrashGameState {
  gameId: string
  phase: 'waiting' | 'running' | 'crashed'
  multiplier: number
  crashPoint: number
  startTime: number
  betId?: string
  betAmount?: number
  cashedOut?: boolean
  cashoutMultiplier?: number
}

// Coinflip
export interface CoinflipResult {
  choice: 'heads' | 'tails'
  result: 'heads' | 'tails'
  won: boolean
  multiplier: number
  winAmount: number
}

// Ladder
export interface LadderRow {
  index: number
  cells: number
  safeCells: number
  selectedCell?: number
  revealed: boolean
  mines: boolean[]
}

export interface LadderGameState {
  betId: string
  rows: LadderRow[]
  currentRow: number
  betAmount: number
  difficulty: 'easy' | 'medium' | 'hard'
  currentMultiplier: number
  status: 'playing' | 'won' | 'lost' | 'cashed_out'
}

// Tower
export interface TowerGameState {
  betId: string
  totalRows: number
  currentRow: number
  betAmount: number
  difficulty: 'easy' | 'medium' | 'hard'
  rows: { safe: number[]; bomb: number[] }[]
  currentMultiplier: number
  status: 'playing' | 'won' | 'lost' | 'cashed_out'
}

// Slots
export interface SlotSymbol {
  id: string
  name: string
  value: number
  color: string
}

export interface SlotsResult {
  reels: string[][]
  lines: string[][]
  winAmount: number
  multiplier: number
  isWin: boolean
  features: string[]
}

// Payments
export interface DepositInvoice {
  invoiceUrl: string
  invoiceId: string
  amount: number
  currency: string
}

export interface WithdrawRequest {
  amount: number
  currency: string
  address?: string
}

// Admin stats
export interface AdminStats {
  totalUsers: number
  totalDeposits: string
  totalWithdrawals: string
  totalBets: number
  totalProfit: string
  onlineToday: number
  pendingWithdrawals: number
}
