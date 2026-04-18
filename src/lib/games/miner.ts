import crypto from 'crypto'

export interface MinerConfig {
  rows: number
  cols: number
  mines: number
}

export const MINER_CONFIGS: Record<string, MinerConfig> = {
  easy: { rows: 5, cols: 5, mines: 3 },
  medium: { rows: 5, cols: 5, mines: 8 },
  hard: { rows: 5, cols: 5, mines: 15 },
  extreme: { rows: 5, cols: 5, mines: 20 },
}

export function generateMinerGrid(rows: number, cols: number, mines: number, seed?: string): boolean[] {
  const total = rows * cols
  const grid = new Array(total).fill(false)
  
  // Place mines randomly using seed for provable fairness
  const hash = seed ? crypto.createHash('sha256').update(seed).digest('hex') : null
  const positions = Array.from({ length: total }, (_, i) => i)
  
  // Fisher-Yates shuffle with seed
  for (let i = positions.length - 1; i > 0; i--) {
    let j: number
    if (hash) {
      // Deterministic shuffle from seed
      const slice = hash.slice((i % 32) * 2, (i % 32) * 2 + 2)
      j = parseInt(slice, 16) % (i + 1)
    } else {
      j = Math.floor(Math.random() * (i + 1))
    }
    ;[positions[i], positions[j]] = [positions[j], positions[i]]
  }
  
  for (let i = 0; i < mines; i++) {
    grid[positions[i]] = true
  }
  
  return grid
}

// Multiplier table: given total cells, mines, and revealed safe cells
export function getMinerMultiplier(total: number, mines: number, revealed: number): number {
  if (revealed === 0) return 1
  
  const safe = total - mines
  let multiplier = 1
  
  // Calculate using hypergeometric distribution
  for (let i = 0; i < revealed; i++) {
    const remainingTotal = total - i
    const remainingSafe = safe - i
    multiplier *= remainingTotal / remainingSafe
  }
  
  // Apply house edge (97% RTP)
  return Math.round(multiplier * 0.97 * 100) / 100
}

export function getNextMinerMultiplier(total: number, mines: number, currentRevealed: number): number {
  return getMinerMultiplier(total, mines, currentRevealed + 1)
}

// Server seed for provable fairness
export function generateServerSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashServerSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex')
}
