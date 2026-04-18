# Royal Casino — Telegram Mini App

A full-featured crypto casino Telegram Mini App built with Next.js 14, Prisma, Supabase, and CryptoBot.

---

## Games
- **Miner** — Avoid mines, reveal safe cells to multiply your bet (provably fair)
- **Crash** — Watch the multiplier rise and cash out before it crashes
- **Coinflip** — 50/50 heads or tails at 1.94x payout
- **Ladder** — Climb rows safely, cash out anytime
- **Tower** — Reach the top floor for maximum multiplier
- **Dog House Slots** — 5-reel 3-row slots with dog wilds
- **Sugar Rush Slots** — Sweet themed slots with candy symbols

---

## Stack
- **Next.js 14** — App Router, TypeScript
- **Prisma + Supabase** — PostgreSQL database
- **CryptoBot** — USDT & TON deposits/withdrawals
- **Telegram Bot API** — Bot commands + WebApp
- **Framer Motion** — Animations
- **Tailwind CSS** — Styling
- **Vercel** — Hosting

---

## Setup Guide

### 1. Clone & Install
```bash
git clone <your-repo>
cd casino
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New project
2. Get connection strings from Settings → Database → Connection string
3. Copy both the "URI" (for `DATABASE_URL`) and direct connection (for `DIRECT_URL`)

### 3. Environment Variables
Copy `.env.example` to `.env.local` and fill in:

```env
# Supabase
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Telegram Bot (already set)
TELEGRAM_BOT_TOKEN="8712523840:AAG0O8BPJqDFl00rsjjylFQ0I4QVJYQ5dkY"
TELEGRAM_ADMIN_ID="1043757036"

# CryptoBot (already set)
CRYPTO_BOT_TOKEN="566069:AAlop8QC8MCVoeYyF1bBV64rG0KiA1XV66s"
CRYPTO_BOT_API_URL="https://pay.crypt.bot/api"

# App (set after Vercel deploy)
NEXTAUTH_SECRET="generate-random-32-char-string"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_BOT_USERNAME="your_bot_username"

REFERRAL_PERCENT="5"
```

Generate a secret: `openssl rand -hex 32`

### 4. Push Database Schema
```bash
npx prisma db push
```

### 5. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Set all environment variables in Vercel Dashboard → Settings → Environment Variables.

### 6. Set Telegram Bot Webhook
After deploy, open in browser:
```
https://your-app.vercel.app/api/setup?secret=YOUR_NEXTAUTH_SECRET
```
This registers the bot webhook and sets bot commands.

### 7. Set up CryptoBot Webhook
In [@CryptoBot](https://t.me/CryptoBot):
1. Open your app
2. Go to Webhooks
3. Set URL to: `https://your-app.vercel.app/api/payments/webhook`

### 8. Set Telegram WebApp URL
In [@BotFather](https://t.me/BotFather):
1. `/mybots` → your bot → Edit Bot → Edit Menu Button
2. Set URL: `https://your-app.vercel.app`
3. Set button text: `Open Casino`

---

## Admin Panel
Visit `https://your-app.vercel.app/admin` from the Telegram WebApp as admin user (ID: 1043757036).

Features:
- View platform statistics
- Search and manage users (ban/unban, add balance)
- Approve/reject manual withdrawals

---

## Referral System
- Each user gets a unique referral code
- Share link: `https://t.me/YOUR_BOT?start=ref_CODE`
- Referrer earns **5%** of every bet placed by referred users
- Bonus on referred user's first deposit

---

## House Edge
| Game | RTP |
|------|-----|
| Miner | 97% |
| Crash | 96% |
| Coinflip | 97% |
| Ladder | 97% |
| Tower | 97% |
| Slots | ~95% |

---

## Project Structure
```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # User registration & auth
│   │   ├── games/         # All game endpoints
│   │   │   ├── miner/
│   │   │   ├── crash/
│   │   │   ├── coinflip/
│   │   │   ├── ladder/
│   │   │   ├── tower/
│   │   │   └── slots/
│   │   ├── payments/
│   │   │   ├── deposit/   # Create CryptoBot invoice
│   │   │   ├── withdraw/  # Process withdrawal
│   │   │   └── webhook/   # CryptoBot payment webhook
│   │   ├── referral/      # Referral stats & link
│   │   ├── admin/         # Admin API
│   │   ├── bot/           # Telegram bot webhook
│   │   └── setup/         # One-time setup endpoint
│   ├── admin/             # Admin UI page
│   ├── layout.tsx
│   ├── page.tsx           # Main app entry
│   └── globals.css
├── components/
│   ├── games/
│   │   ├── MinerGame.tsx
│   │   ├── CrashGame.tsx
│   │   ├── CoinflipGame.tsx
│   │   ├── LadderGame.tsx
│   │   ├── TowerGame.tsx
│   │   ├── SlotsGame.tsx
│   │   └── shared/
│   │       ├── BetInput.tsx
│   │       └── GameHeader.tsx
│   ├── layout/
│   │   ├── HomeScreen.tsx
│   │   ├── BottomNav.tsx
│   │   └── tabs/
│   │       ├── GamesTab.tsx
│   │       ├── WalletTab.tsx
│   │       ├── ReferralTab.tsx
│   │       └── ProfileTab.tsx
│   └── ui/
│       └── LoadingScreen.tsx
├── hooks/
│   └── useUser.ts         # Zustand user store
├── lib/
│   ├── db/prisma.ts       # Prisma client
│   ├── cryptobot/         # CryptoBot API wrapper
│   ├── telegram/          # Auth validation & bot helpers
│   └── games/             # Game logic (miner, crash, slots, ladder-tower)
├── types/index.ts
└── styles/globals.css
prisma/schema.prisma       # Database schema
```
