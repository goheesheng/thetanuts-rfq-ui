'use client';

import { formatPrice, formatTokenAmount } from '@/lib/utils';

interface OrderSummaryProps {
  optionType: 'CALL' | 'PUT';
  isLong: boolean;
  strikes: number[];
  expiry: number | null;
  numContracts: number;
  reservePrice: number;
  collateralSymbol: string;
  structure: string;
  confirmCountdown: number | null;
  onSubmit: () => void;
  onConfirm: () => void;
  isPending: boolean;
  isWalletConnected: boolean;
  settlementType?: 'cash' | 'physical';
  deliveryInfo?: { amount: number; token: string };
}

export default function OrderSummary({
  optionType,
  isLong,
  strikes,
  expiry,
  numContracts,
  reservePrice,
  collateralSymbol,
  structure,
  confirmCountdown,
  onSubmit,
  onConfirm,
  isPending,
  isWalletConnected,
  settlementType,
  deliveryInfo,
}: OrderSummaryProps) {
  return (
    <div className="border border-[var(--color-border)] p-2 space-y-1.5">
      <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">order summary</div>

      <div className="space-y-0.5 text-xs">
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">side</span>
          <span className={isLong ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
            {isLong ? 'buy' : 'sell'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">type</span>
          <span className={optionType === 'CALL' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
            {optionType.toLowerCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">structure</span>
          <span>{structure}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">strike(s)</span>
          <span>{strikes.map(s => formatPrice(s)).join(' / ')}</span>
        </div>
        {expiry && (
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">expiry</span>
            <span>{new Date(expiry * 1000).toLocaleDateString()}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">contracts</span>
          <span>{formatTokenAmount(numContracts)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">reserve price</span>
          <span>{formatTokenAmount(reservePrice, 6)} {collateralSymbol}</span>
        </div>
        {settlementType && (
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">settlement</span>
            <span>{settlementType}</span>
          </div>
        )}
        {deliveryInfo && (
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">delivery</span>
            <span>{formatTokenAmount(deliveryInfo.amount)} {deliveryInfo.token}</span>
          </div>
        )}
      </div>

      <div className="pt-1">
        {!isWalletConnected ? (
          <div className="text-xs text-[var(--color-text-tertiary)] text-center py-1">connect wallet to trade</div>
        ) : confirmCountdown !== null ? (
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full px-3 py-2 text-xs cursor-pointer border border-[var(--color-accent-orange)] text-[var(--color-accent-orange)] hover:bg-[var(--color-accent-orange)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
          >
            {isPending ? 'submitting...' : `confirm trade (${confirmCountdown}s)`}
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={isPending || strikes.length === 0 || !expiry}
            className="w-full px-3 py-2 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
          >
            {isPending ? 'loading...' : '> submit rfq'}
          </button>
        )}
      </div>
    </div>
  );
}
