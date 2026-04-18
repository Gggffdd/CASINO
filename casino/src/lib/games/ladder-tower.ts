// ===================== LADDER GAME =====================

export interface LadderDifficulty {
  cells: number
  mines: number
  multiplierPerRow: number
}

export const LADDER_DIFFICULTIES: Record<string, LadderDifficulty> = {
  easy: { cells: 3, mines: 1, multiplierPerRow: 1.4 },
  medium: { cells: 3, mines: 2, multiplierPerRow: 2.4 },
  hard: { cells: 4, mines: 3, multiplierPerRow: 3.8 },
}

export function generateLadderRow(cells: number, mines: number): boolean[] {
  const row = new Array(cells).fill(false)
  let minesPlaced = 0
  while (minesPlaced < mines) {
    const pos = Math.floor(Math.random() * cells)
    if (!row[pos]) {
      row[pos] = true
      minesPlaced++
    }
  }
  return row
}

export function getLadderMultiplier(difficulty: string, row: number): number {
  const config = LADDER_DIFFICULTIES[difficulty]
  if (!config) return 1
  const base = Math.pow(config.multiplierPerRow, row + 1)
  return Math.round(base * 0.97 * 100) / 100
}

// ===================== TOWER GAME =====================

export interface TowerDifficulty {
  cols: number
  mines: number
  rows: number
}

export const TOWER_DIFFICULTIES: Record<string, TowerDifficulty> = {
  easy: { cols: 4, mines: 1, rows: 10 },
  medium: { cols: 3, mines: 1, rows: 12 },
  hard: { cols: 2, mines: 1, rows: 15 },
  extreme: { cols: 1, mines: 0, rows: 20 }, // 50/50 each step
}

export function generateTowerRow(cols: number, mines: number): boolean[] {
  const row = new Array(cols).fill(false)
  let placed = 0
  while (placed < mines) {
    const pos = Math.floor(Math.random() * cols)
    if (!row[pos]) {
      row[pos] = true
      placed++
    }
  }
  return row
}

export function getTowerMultiplier(difficulty: string, row: number): number {
  const config = TOWER_DIFFICULTIES[difficulty]
  if (!config) return 1
  
  const safeProb = (config.cols - config.mines) / config.cols
  const base = Math.pow(1 / safeProb, row + 1)
  return Math.round(base * 0.97 * 100) / 100
}

// ===================== COINFLIP =====================

export function coinflipResult(): 'heads' | 'tails' {
  return Math.random() < 0.5 ? 'heads' : 'tails'
}

export const COINFLIP_MULTIPLIER = 1.94 // 97% RTP
