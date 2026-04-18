import crypto from 'crypto'

const HOUSE_EDGE = 0.04 // 4%

// Generate crash point from server seed (provably fair)
export function generateCrashPoint(seed: string): number {
  const hash = crypto.createHmac('sha256', seed).update('crash').digest('hex')
  const h = parseInt(hash.slice(0, 8), 16)
  const e = Math.pow(2, 32)

  // Crash point formula (provably fair)
  const crashPoint = Math.max(1, (100 * e - h) / (e - h) / 100)
  
  // Apply house edge: ~4% chance to crash at 1x
  if (h % 25 === 0) return 1.00

  return Math.floor(crashPoint * 100) / 100
}

export function generateSeed(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function hashSeed(seed: string): string {
  return crypto.createHash('sha256').update(seed).digest('hex')
}

// Time to reach a given multiplier (ms)
export function timeToMultiplier(multiplier: number): number {
  // Exponential growth: m = e^(t * 0.00006)
  return Math.log(multiplier) / 0.00006
}

// Multiplier at given time (ms)
export function multiplierAtTime(elapsed: number): number {
  const m = Math.pow(Math.E, 0.00006 * elapsed)
  return Math.floor(m * 100) / 100
}

// Expected value at cashout
export function crashExpectedValue(betAmount: number, cashoutAt: number): number {
  const probability = 1 / cashoutAt
  return betAmount * cashoutAt * probability * (1 - HOUSE_EDGE)
}
