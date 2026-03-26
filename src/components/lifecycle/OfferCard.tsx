'use client';

import { shortenAddress, formatTokenAmount } from '@/lib/utils';

interface OfferCardProps {
  offer: any;
  onAccept?: () => void;
  isPending?: boolean;
}

export default function OfferCard({ offer, onAccept, isPending }: OfferCardProps) {
  return (
    <div className="border border-[var(--color-border-subtle)] p-2 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-[var(--color-text-tertiary)]">
          {shortenAddress(offer.offeror)}
        </span>
        {offer.decryptedAmount ? (
          <span className="text-[var(--color-text-primary)]">
            {formatTokenAmount(Number(offer.decryptedAmount) / 1e6, 6)}
          </span>
        ) : (
          <span className="text-[var(--color-text-tertiary)]">[encrypted]</span>
        )}
      </div>
      {onAccept && offer.decryptedAmount && (
        <button
          onClick={onAccept}
          disabled={isPending}
          className="mt-1 w-full px-2 py-1 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
        >
          {isPending ? 'accepting...' : 'accept offer'}
        </button>
      )}
    </div>
  );
}
