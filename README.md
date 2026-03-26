# rfq-ui — Thetanuts RFQ Trading Starter

Developer-friendly starter app for Thetanuts OptionFactory RFQ lifecycle on Base.

## Quick Start
1. `cp .env.example .env.local` and fill in `WALLET_CONNECT_PROJECT_ID`
2. `npm install`
3. `npm run dev`
4. Open http://localhost:3000

## Features
- `/trade` — Option chain + order panel (RFQ creation, lifecycle, settlement)
- `/history` — Full RFQ/offer/option history
- `/mm` — Market Maker console (offer, reveal, settle)

## Architecture
- Next.js 15 + React 19 + TypeScript
- ethers.js 6 + Reown AppKit (no wagmi)
- @thetanuts/thetanuts-client SDK for all on-chain + API interactions
- @tanstack/react-query for data fetching
- Tailwind CSS 4 (terminal aesthetic)

## Forking
1. Fork this repo
2. Update `.env.local` with your WalletConnect project ID
3. Modify components in `src/components/` to customize the UI
4. Add new hooks in `src/hooks/` for additional features
5. All contract addresses come from the SDK's chain config — no hardcoded addresses to update

## Key Files
- `src/lib/rfqUtils.ts` — RFQ calculations (numContracts, reserve price, stage detection)
- `src/lib/pnlUtils.ts` — P&L formulas for all option types
- `src/hooks/useRFQCreate.ts` — RFQ submission flow
- `src/hooks/useMMOffer.ts` — Market maker offer flow
- `src/providers.tsx` — SDK client + wallet + query setup
