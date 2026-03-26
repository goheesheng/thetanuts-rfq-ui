'use client';

import { useWallet } from '../hooks/useWallet';
import { useCollateralBalance } from '../hooks/useCollateralBalance';
import { useCollateralAllowance } from '../hooks/useCollateralAllowance';
import { useChainlinkPrices } from '../hooks/useChainlinkPrices';
import { useSigningKey } from '../hooks/useSigningKey';
import {
  USDC_ADDRESS, USDC_DECIMALS,
  WETH_ADDRESS, WETH_DECIMALS,
  CBBTC_ADDRESS, CBBTC_DECIMALS,
} from '../lib/constants';
import { ethers } from 'ethers';

const TOKENS = [
  { symbol: 'USDC', address: USDC_ADDRESS, decimals: USDC_DECIMALS, isStable: true },
  { symbol: 'WETH', address: WETH_ADDRESS, decimals: WETH_DECIMALS, priceKey: 'ETH' },
  { symbol: 'cbBTC', address: CBBTC_ADDRESS, decimals: CBBTC_DECIMALS, priceKey: 'BTC' },
] as const;

function TokenRow({ symbol, address, decimals, spotPrice }: {
  symbol: string;
  address: string;
  decimals: number;
  spotPrice?: number;
}) {
  const { formattedBalance, isLoading: balLoading } = useCollateralBalance(address, decimals);
  const { isApproved, allowance, approveMax, approving } = useCollateralAllowance(address, decimals);

  const formatAllowance = () => {
    if (allowance >= ethers.MaxUint256 / 2n) return '∞';
    const val = Number(allowance) / 10 ** decimals;
    return val > 1000 ? `${(val / 1000).toFixed(1)}k` : val.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[var(--color-text-primary)] w-12 shrink-0">{symbol}</span>
        <span className="text-[var(--color-text-secondary)]">
          {balLoading ? '...' : formattedBalance}
        </span>
        {spotPrice != null && (
          <span className="text-[var(--color-text-tertiary)]">
            (${spotPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })})
          </span>
        )}
      </div>
      <div className="shrink-0">
        {isApproved ? (
          <span className="text-[var(--color-accent-green)]">[{formatAllowance()}]</span>
        ) : (
          <button
            className="border border-[var(--color-accent-green)] text-[var(--color-accent-green)] px-1.5 py-0.5 text-[10px] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] cursor-pointer bg-transparent disabled:opacity-50"
            onClick={approveMax}
            disabled={approving}
          >
            {approving ? '...' : 'approve'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function WalletInfo() {
  const { address } = useWallet();
  const { data: spotPrices } = useChainlinkPrices();
  const { publicKey, loading: keyLoading } = useSigningKey();

  if (!address) return null;

  return (
    <div className="border border-[var(--color-border)] text-xs mb-3">
      <div className="px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">balances & approvals</span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {spotPrices ? Object.entries(spotPrices).map(([sym, price], i) => (
            <span key={sym}>{i > 0 ? ' · ' : ''}{sym} ${price.toLocaleString(undefined, { maximumFractionDigits: price < 1 ? 4 : price < 100 ? 2 : 0 })}</span>
          )) : ''}
        </span>
      </div>
      <div className="px-3 py-1">
        {TOKENS.map((t) => (
          <TokenRow
            key={t.symbol}
            symbol={t.symbol}
            address={t.address}
            decimals={t.decimals}
            spotPrice={'priceKey' in t && t.priceKey ? spotPrices?.[t.priceKey] : undefined}
          />
        ))}
        <div className="flex items-center gap-2 py-1 border-t border-[var(--color-border-subtle)]">
          <span className="text-[var(--color-text-tertiary)] w-12 shrink-0">key</span>
          <span className="text-[var(--color-text-secondary)] font-mono truncate">
            {keyLoading ? '...' : publicKey ?? 'none'}
          </span>
        </div>
      </div>
    </div>
  );
}
