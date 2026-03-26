import { PRICE_DECIMALS, PRICE_DIVISOR, USDC_DECIMALS } from './constants';

// ---------------------------------------------------------------------------
// Number parsing & formatting (string-based, no floating-point loss)
// ---------------------------------------------------------------------------

/** Parse a decimal string like "2.40" into bigint units without floating point loss */
export function parseUnits(value: string, decimals: number): bigint {
  const [whole = '0', frac = ''] = value.split('.');
  const padded = (frac + '0'.repeat(decimals)).slice(0, decimals);
  return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(padded);
}

/** Format bigint to human-readable string with full precision */
export function formatUnits(value: bigint, decimals: number): string {
  const str = value.toString().padStart(decimals + 1, '0');
  const whole = str.slice(0, str.length - decimals);
  const frac = str.slice(str.length - decimals).replace(/0+$/, '');
  return frac ? `${whole}.${frac}` : whole;
}

/** Format a strike from 8-decimal bigint */
export function formatStrike(strike: bigint | number): string {
  const num = typeof strike === 'bigint' ? Number(strike) / PRICE_DIVISOR : strike;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format premium from 8-decimal bigint */
export function formatPremium(price: bigint | number): string {
  const num = typeof price === 'bigint' ? Number(price) / PRICE_DIVISOR : price;
  return '$' + formatTokenAmount(num);
}

/** Format USDC amount from 6-decimal bigint */
export function formatUSDC(amount: bigint): string {
  const num = Number(amount) / 10 ** USDC_DECIMALS;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format a number as USD price */
export function formatPrice(price: number): string {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Format time remaining from timestamp */
export function formatExpiry(timestamp: bigint | number): string {
  const now = Date.now() / 1000;
  const expiry = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  const diff = expiry - now;

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/** Format timestamp to locale date string */
export function formatExpiryDate(timestamp: bigint | number): string {
  const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
  return new Date(ts * 1000).toLocaleString();
}

/** Format timestamp to short date (e.g., "14Mar") */
export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = date.getUTCDate();
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day}${months[date.getUTCMonth()]}`;
}

/** Shorten an Ethereum address */
export function shortenAddress(a: string | null | undefined): string {
  return a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '-';
}

/** Format a token amount for display (4 sig figs) */
export function formatTokenAmount(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0';
  if (Math.abs(amount) < 0.0001) {
    return amount.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
  }
  return amount.toFixed(decimals);
}

/** Explorer link for address */
export function explorerAddress(address: string, explorerUrl?: string): string {
  const base = explorerUrl ?? _defaultExplorerUrl();
  return `${base}/address/${address}`;
}

/** Explorer link for transaction */
export function explorerTx(txHash: string, explorerUrl?: string): string {
  const base = explorerUrl ?? _defaultExplorerUrl();
  return `${base}/tx/${txHash}`;
}

function _defaultExplorerUrl(): string {
  const { buildChainConstants } = require('./constants');
  const { DEFAULT_CHAIN_ID } = require('./chains');
  return buildChainConstants(DEFAULT_CHAIN_ID).explorerUrl;
}
