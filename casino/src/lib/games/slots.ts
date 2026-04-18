import crypto from 'crypto'

// ===================== DOG HOUSE SLOTS =====================
export const DOG_SYMBOLS = [
  { id: 'scatter', name: 'Scatter', value: 0, weight: 2, color: '#f59e0b' },
  { id: 'wild', name: 'Wild', value: 0, weight: 3, color: '#7c3aed' },
  { id: 'purple_dog', name: 'Purple', value: 250, weight: 6, color: '#9d5cf6' },
  { id: 'blue_dog', name: 'Blue', value: 150, weight: 8, color: '#3b82f6' },
  { id: 'green_dog', name: 'Green', value: 100, weight: 10, color: '#10b981' },
  { id: 'yellow_dog', name: 'Yellow', value: 50, weight: 12, color: '#f59e0b' },
  { id: 'paw', name: 'Paw', value: 20, weight: 20, color: '#ef4444' },
  { id: 'bone', name: 'Bone', value: 10, weight: 30, color: '#a0a0b8' },
]

// ===================== SUGAR RUSH SLOTS =====================
export const SUGAR_SYMBOLS = [
  { id: 'scatter', name: 'Scatter', value: 0, weight: 2, color: '#f59e0b' },
  { id: 'wild', name: 'Wild', value: 0, weight: 3, color: '#7c3aed' },
  { id: 'candy_heart', name: 'Heart', value: 200, weight: 5, color: '#ec4899' },
  { id: 'lollipop', name: 'Lollipop', value: 150, weight: 7, color: '#f97316' },
  { id: 'gummy', name: 'Gummy', value: 100, weight: 10, color: '#10b981' },
  { id: 'chocolate', name: 'Choco', value: 75, weight: 12, color: '#92400e' },
  { id: 'cupcake', name: 'Cupcake', value: 40, weight: 18, color: '#f472b6' },
  { id: 'candy', name: 'Candy', value: 15, weight: 28, color: '#60a5fa' },
]

const REELS = 5
const ROWS = 3

type Symbol = typeof DOG_SYMBOLS[0]

function weightedRandom(symbols: Symbol[]): Symbol {
  const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0)
  let rand = Math.random() * totalWeight
  for (const sym of symbols) {
    rand -= sym.weight
    if (rand <= 0) return sym
  }
  return symbols[symbols.length - 1]
}

function spinReels(symbols: Symbol[]): Symbol[][] {
  const grid: Symbol[][] = []
  for (let col = 0; col < REELS; col++) {
    const reel: Symbol[] = []
    for (let row = 0; row < ROWS; row++) {
      reel.push(weightedRandom(symbols))
    }
    grid.push(reel)
  }
  return grid
}

// Pay lines: 20 lines
const PAY_LINES = [
  [0, 0, 0, 0, 0], // top
  [1, 1, 1, 1, 1], // middle
  [2, 2, 2, 2, 2], // bottom
  [0, 1, 2, 1, 0], // V shape
  [2, 1, 0, 1, 2], // inverted V
  [0, 0, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
  [2, 2, 1, 2, 2],
  [0, 1, 1, 1, 0],
]

function checkLine(grid: Symbol[][], line: number[]): { count: number; symbol: Symbol | null; positions: number[] } {
  const firstSym = grid[0][line[0]]
  if (!firstSym) return { count: 0, symbol: null, positions: [] }
  
  let count = 1
  const positions = [0]
  
  for (let col = 1; col < REELS; col++) {
    const sym = grid[col][line[col]]
    // Wild substitutes any symbol
    if (sym.id === 'wild' || sym.id === firstSym.id || (firstSym.id === 'wild' && sym.id !== 'scatter')) {
      count++
      positions.push(col)
    } else {
      break
    }
  }
  
  return { count, symbol: firstSym.id === 'wild' ? grid[1][line[1]] : firstSym, positions }
}

function getLineMultiplier(symbol: Symbol, count: number, isWild: boolean): number {
  if (count < 3) return 0
  const base = symbol.value
  const countMult = count === 3 ? 1 : count === 4 ? 3 : 10
  const wildBonus = isWild ? 2 : 1
  return (base / 100) * countMult * wildBonus
}

export interface SlotsSpinResult {
  grid: Symbol[][]
  winLines: { lineIndex: number; positions: number[]; symbol: Symbol; count: number; multiplier: number }[]
  scatters: number
  hasFreeSpin: boolean
  totalMultiplier: number
  winAmount: number
  betAmount: number
}

export function spinSlots(symbols: Symbol[], betAmount: number): SlotsSpinResult {
  const grid = spinReels(symbols)
  const winLines = []
  let totalMultiplier = 0

  // Count scatters
  let scatters = 0
  for (let col = 0; col < REELS; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (grid[col][row].id === 'scatter') scatters++
    }
  }

  // Check pay lines
  for (let i = 0; i < PAY_LINES.length; i++) {
    const { count, symbol, positions } = checkLine(grid, PAY_LINES[i])
    if (!symbol || count < 3) continue
    
    const hasWild = positions.some(p => grid[p][PAY_LINES[i][p]].id === 'wild')
    const mult = getLineMultiplier(symbol, count, hasWild)
    if (mult > 0) {
      winLines.push({ lineIndex: i, positions, symbol, count, multiplier: mult })
      totalMultiplier += mult
    }
  }

  // Scatter pays
  if (scatters >= 3) {
    totalMultiplier += scatters >= 5 ? 50 : scatters >= 4 ? 15 : 5
  }

  const winAmount = betAmount * totalMultiplier

  return {
    grid,
    winLines,
    scatters,
    hasFreeSpin: scatters >= 3,
    totalMultiplier: Math.round(totalMultiplier * 100) / 100,
    winAmount: Math.round(winAmount * 100) / 100,
    betAmount,
  }
}

export { DOG_SYMBOLS as DOG_HOUSE_SYMBOLS, SUGAR_SYMBOLS as SUGAR_RUSH_SYMBOLS }
