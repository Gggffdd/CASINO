'use client'
import { motion } from 'framer-motion'

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-bg-primary flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24"
          >
            <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="48" cy="48" r="46" stroke="url(#grad1)" strokeWidth="2" strokeDasharray="8 4"/>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/>
                  <stop offset="1" stopColor="#f59e0b"/>
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-12">
              <path d="M24 4L44 14V34L24 44L4 34V14L24 4Z" fill="url(#logoGrad)" />
              <path d="M24 14L30 20L24 26L18 20L24 14Z" fill="rgba(255,255,255,0.9)"/>
              <path d="M14 22L20 28L14 34" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              <path d="M34 22L28 28L34 34" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="logoGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7c3aed"/>
                  <stop offset="1" stopColor="#9d5cf6"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-black text-white tracking-wider shine-text">ROYAL CASINO</h1>
          <p className="text-text-muted text-sm mt-1">Loading your session...</p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-accent-purple"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
