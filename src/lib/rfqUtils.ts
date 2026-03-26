import { OPTION_IMPLEMENTATIONS, getCollateralInfo } from './constants';
import {
  calculateNumContracts as sdkCalculateNumContracts,
  calculateCollateralRequired as sdkCalculateCollateralRequired,
  calculateDeliveryAmount,
  isPhysicalProduct,
  validateButterfly,
  validateCondor,
  validateIronCondor,
  type ProductName,
} from '@thetanuts-finance/thetanuts-client';

export { sdkCalculateNumContracts, sdkCalculateCollateralRequired, calculateDeliveryAmount, isPhysicalProduct, validateButterfly, validateCondor, validateIronCondor };
export type { ProductName };

// ---------------------------------------------------------------------------
// RFQ Stage Detection
// ---------------------------------------------------------------------------

export type RfqStage = 'offer' | 'reveal' | 'post-reveal' | 'limit' | 'settled' | 'cancelled' | 'active' | 'settled-itm' | 'settled-otm' | 'closed' | 'expired-awaiting-settlement';

// Default reveal window (seconds) — should be read from contract, but cached here
const REVEAL_WINDOW = 300; // 5 minutes

export function getRfqStage(rfq: any): RfqStage {
  if (!rfq) return 'cancelled';

  const isActive = rfq.isActive ?? rfq.status === 'active';
  const optionAddress = rfq.optionAddress ?? rfq.optionContract;
  const currentWinner = rfq.currentWinner ?? rfq.winner;
  const convertToLimitOrder = rfq.convertToLimitOrder ?? false;
  const offerEndTimestamp = Number(rfq.offerEndTimestamp ?? 0);
  const now = Math.floor(Date.now() / 1000);

  if (!isActive) {
    if (optionAddress && optionAddress !== '0x0000000000000000000000000000000000000000') {
      return 'settled';
    }
    return 'cancelled';
  }

  if (now < offerEndTimestamp) {
    return 'offer';
  }

  if (now < offerEndTimestamp + REVEAL_WINDOW) {
    return 'reveal';
  }

  // Post-reveal
  const hasWinner = currentWinner && currentWinner !== '0x0000000000000000000000000000000000000000';
  if (hasWinner) {
    return 'post-reveal';
  }

  if (convertToLimitOrder) {
    return 'limit';
  }

  return 'post-reveal';
}

// ---------------------------------------------------------------------------
// Stage badge colors
// ---------------------------------------------------------------------------

export const STAGE_CONFIG: Record<RfqStage, { label: string; color: string; bgClass: string }> = {
  offer: { label: 'Offer', color: 'var(--color-accent-green)', bgClass: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]' },
  reveal: { label: 'Reveal', color: 'var(--color-accent-orange)', bgClass: 'bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]' },
  'post-reveal': { label: 'Post-Reveal', color: 'var(--color-accent-orange)', bgClass: 'bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]' },
  limit: { label: 'Limit Order', color: 'var(--color-accent-blue)', bgClass: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]' },
  settled: { label: 'Settled', color: 'var(--color-text-tertiary)', bgClass: 'bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-tertiary)]' },
  cancelled: { label: 'Cancelled', color: 'var(--color-accent-red)', bgClass: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]' },
  active: { label: 'Active', color: 'var(--color-accent-green)', bgClass: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]' },
  'settled-itm': { label: 'Settled ITM', color: 'var(--color-accent-green)', bgClass: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]' },
  'settled-otm': { label: 'Settled OTM', color: 'var(--color-accent-red)', bgClass: 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)]' },
  closed: { label: 'Closed', color: 'var(--color-text-tertiary)', bgClass: 'bg-[var(--color-text-tertiary)]/20 text-[var(--color-text-tertiary)]' },
  'expired-awaiting-settlement': { label: 'Awaiting Settlement', color: 'var(--color-accent-orange)', bgClass: 'bg-[var(--color-accent-orange)]/20 text-[var(--color-accent-orange)]' },
};

// ---------------------------------------------------------------------------
// Settlement type
// ---------------------------------------------------------------------------

export type SettlementType = 'cash' | 'physical';

/** Get the physical product name for a given option type */
export function getPhysicalProduct(optionType: 'CALL' | 'PUT'): ProductName {
  return optionType === 'CALL' ? 'PHYSICAL_CALL' : 'PHYSICAL_PUT';
}

// ---------------------------------------------------------------------------
// Structure detection from strikes
// ---------------------------------------------------------------------------

export type StructureType = 'vanilla' | 'spread' | 'butterfly' | 'condor' | 'iron_condor';

export function getStructureFromStrikes(strikes: number[]): StructureType {
  switch (strikes.length) {
    case 1: return 'vanilla';
    case 2: return 'spread';
    case 3: return 'butterfly';
    case 4: return 'condor'; // caller must disambiguate condor vs iron_condor
    default: return 'vanilla';
  }
}

// ---------------------------------------------------------------------------
// Implementation routing
// ---------------------------------------------------------------------------

export function getImplementationType(
  optionType: 'CALL' | 'PUT',
  numStrikes: number,
  isIronCondor: boolean = false
): ProductName {
  if (numStrikes === 1) {
    return optionType === 'CALL' ? 'INVERSE_CALL' : 'PUT';
  }
  if (numStrikes === 2) {
    return optionType === 'CALL' ? 'CALL_SPREAD' : 'PUT_SPREAD';
  }
  if (numStrikes === 3) {
    return optionType === 'CALL' ? 'CALL_FLYS' : 'PUT_FLYS';
  }
  if (numStrikes === 4) {
    if (isIronCondor) return 'IRON_CONDOR';
    return optionType === 'CALL' ? 'CALL_CONDOR' : 'PUT_CONDOR';
  }
  return 'PUT';
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

export function formatRfqId(id: string | number | bigint): string {
  return `#${id}`;
}

export function formatOfferEndTime(offerEndTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = offerEndTimestamp - now;

  if (diff <= 0) return 'Ended';

  const hours = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;

  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/** Get collateral token info for an option type and underlying */
export function getCollateralForOption(
  optionType: 'CALL' | 'PUT',
  underlying: string,
  tokens: Record<string, { address: string; symbol: string; decimals: number }>
): { address: string; symbol: string; decimals: number } | null {
  if (optionType === 'PUT') {
    return tokens['USDC'] ?? null;
  }
  // Calls use underlying collateral (INVERSE_CALL in v6)
  if (underlying === 'ETH') return tokens['WETH'] ?? null;
  if (underlying === 'BTC') return tokens['cbBTC'] ?? null;
  return null;
}
