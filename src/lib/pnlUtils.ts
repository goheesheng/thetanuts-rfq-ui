// ---------------------------------------------------------------------------
// P&L Calculation Utilities
// ---------------------------------------------------------------------------

/**
 * Unrealized P&L for open positions (mark-to-market via MM pricing).
 *
 * For Buyers (Long):
 *   entryValue = entryPricePerContract × numContracts
 *   currentValue = currentSellPrice × numContracts
 *   pnl = currentValue - entryValue
 *
 * For Sellers (Short):
 *   entryValue = premiumReceived
 *   currentValue = currentBuyPrice × numContracts
 *   pnl = entryValue - currentValue
 */
export function calculateUnrealizedPnL(
  entryPricePerContract: number,
  currentPricePerContract: number,
  numContracts: number,
  isBuyer: boolean
): { pnl: number; pnlPercent: number } {
  const entryValue = entryPricePerContract * numContracts;

  if (isBuyer) {
    const currentValue = currentPricePerContract * numContracts;
    const pnl = currentValue - entryValue;
    const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
    return { pnl, pnlPercent };
  }

  // Seller
  const currentValue = currentPricePerContract * numContracts;
  const pnl = entryValue - currentValue;
  const pnlPercent = entryValue > 0 ? (pnl / entryValue) * 100 : 0;
  return { pnl, pnlPercent };
}

// ---------------------------------------------------------------------------
// Settlement Payout Calculations (by option type)
// ---------------------------------------------------------------------------

/**
 * Vanilla Call (INVERSE_CALL) payout at expiry.
 * Buyer payout = max(0, settlementPrice - strike) × numContracts / scale
 */
export function callPayout(
  settlementPrice: number,
  strike: number,
  numContracts: number
): number {
  return Math.max(0, settlementPrice - strike) * numContracts;
}

/**
 * Vanilla Put payout at expiry.
 * Buyer payout = max(0, strike - settlementPrice) × numContracts / scale
 */
export function putPayout(
  settlementPrice: number,
  strike: number,
  numContracts: number
): number {
  return Math.max(0, strike - settlementPrice) * numContracts;
}

/**
 * Call Spread payout at expiry.
 * Buyer payout = max(0, min(settlementPrice, upperStrike) - lowerStrike) × numContracts
 */
export function callSpreadPayout(
  settlementPrice: number,
  lowerStrike: number,
  upperStrike: number,
  numContracts: number
): number {
  return Math.max(0, Math.min(settlementPrice, upperStrike) - lowerStrike) * numContracts;
}

/**
 * Put Spread payout at expiry.
 * Buyer payout = max(0, upperStrike - max(settlementPrice, lowerStrike)) × numContracts
 */
export function putSpreadPayout(
  settlementPrice: number,
  lowerStrike: number,
  upperStrike: number,
  numContracts: number
): number {
  return Math.max(0, upperStrike - Math.max(settlementPrice, lowerStrike)) * numContracts;
}

/**
 * Call Butterfly payout (strikes = [K1, K2, K3]).
 */
export function callButterflyPayout(
  settlementPrice: number,
  k1: number,
  k2: number,
  k3: number,
  numContracts: number
): number {
  if (settlementPrice < k1) return 0;
  if (settlementPrice <= k2) return (settlementPrice - k1) * numContracts;
  if (settlementPrice <= k3) return (k3 - settlementPrice) * numContracts;
  return 0;
}

/**
 * Call Condor payout (strikes = [K1, K2, K3, K4]).
 */
export function callCondorPayout(
  settlementPrice: number,
  k1: number,
  k2: number,
  k3: number,
  k4: number,
  numContracts: number
): number {
  if (settlementPrice < k1) return 0;
  if (settlementPrice <= k2) return (settlementPrice - k1) * numContracts;
  if (settlementPrice <= k3) return (k2 - k1) * numContracts; // Max profit zone
  if (settlementPrice <= k4) return (k4 - settlementPrice) * numContracts;
  return 0;
}

/**
 * Iron Condor payout.
 * Combines short call spread + short put spread.
 */
export function ironCondorPayout(
  settlementPrice: number,
  k1: number,
  k2: number,
  k3: number,
  k4: number,
  numContracts: number
): number {
  const callSpread = callSpreadPayout(settlementPrice, k3, k4, numContracts);
  const putSpread = putSpreadPayout(settlementPrice, k1, k2, numContracts);
  return callSpread + putSpread;
}

/**
 * Calculate collateral required by structure type.
 */
export function calculateCollateral(
  structureType: string,
  strikes: number[],
  numContracts: number
): number {
  switch (structureType) {
    case 'vanilla':
    case 'INVERSE_CALL':
    case 'PUT':
      return strikes[0] * numContracts;
    case 'spread':
    case 'CALL_SPREAD':
    case 'PUT_SPREAD':
      return Math.abs(strikes[1] - strikes[0]) * numContracts;
    case 'butterfly':
    case 'CALL_FLY':
    case 'PUT_FLY':
      return (strikes[2] - strikes[0]) * numContracts;
    case 'condor':
    case 'CALL_CONDOR':
    case 'PUT_CONDOR':
    case 'IRON_CONDOR':
      return Math.max(strikes[1] - strikes[0], strikes[3] - strikes[2]) * numContracts;
    default:
      return strikes[0] * numContracts;
  }
}

/**
 * Generic payout calculation by option type.
 */
export function calculatePayout(
  type: string,
  strikes: number[],
  settlementPrice: number,
  numContracts: number
): number {
  switch (type) {
    case 'INVERSE_CALL':
    case 'call':
      return callPayout(settlementPrice, strikes[0], numContracts);
    case 'PUT':
    case 'put':
      return putPayout(settlementPrice, strikes[0], numContracts);
    case 'CALL_SPREAD':
    case 'call_spread':
      return callSpreadPayout(settlementPrice, strikes[0], strikes[1], numContracts);
    case 'PUT_SPREAD':
    case 'put_spread':
      return putSpreadPayout(settlementPrice, strikes[0], strikes[1], numContracts);
    case 'CALL_FLY':
    case 'PUT_FLY':
    case 'butterfly':
      return callButterflyPayout(settlementPrice, strikes[0], strikes[1], strikes[2], numContracts);
    case 'CALL_CONDOR':
    case 'PUT_CONDOR':
    case 'condor':
      return callCondorPayout(settlementPrice, strikes[0], strikes[1], strikes[2], strikes[3], numContracts);
    case 'IRON_CONDOR':
    case 'iron_condor':
      return ironCondorPayout(settlementPrice, strikes[0], strikes[1], strikes[2], strikes[3], numContracts);
    default:
      return 0;
  }
}
