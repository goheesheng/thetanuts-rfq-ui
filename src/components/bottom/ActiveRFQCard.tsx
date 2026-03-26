'use client';

import { useRFQDetail } from '@/hooks/useRFQDetail';
import { useSettleRFQ } from '@/hooks/useSettleRFQ';
import { useWallet } from '@/hooks/useWallet';
import { shortenAddress, explorerAddress } from '@/lib/utils';
import type { RfqStage } from '@/lib/rfqUtils';
import OfferCard from '../lifecycle/OfferCard';

interface ActiveRFQCardProps {
  rfq: any;
  quotationId: string;
  stage: RfqStage;
}

export default function ActiveRFQCard({ rfq, quotationId, stage }: ActiveRFQCardProps) {
  const { offers, isLoading: offersLoading } = useRFQDetail(quotationId);
  const { settleEarly, settle, cancel, isPending } = useSettleRFQ();
  const { address } = useWallet();

  const isOwner = rfq.requester?.toLowerCase() === address?.toLowerCase();
  const canCancel = isOwner && ['offer', 'reveal', 'post-reveal', 'limit'].includes(stage);
  const canSettle = stage === 'post-reveal' || stage === 'limit';

  return (
    <div className="mx-2 mb-2 border border-[var(--color-border)] bg-[var(--color-canvas)]">
      {/* RFQ Details */}
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        details
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">requester</span>
            <span className="text-[var(--color-text-secondary)]">{shortenAddress(rfq.requester)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">collateral</span>
            <span className="text-[var(--color-text-secondary)]">{shortenAddress(rfq.collateral)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">contracts</span>
            <span className="text-[var(--color-text-primary)]">{rfq.numContracts ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">reserve</span>
            <span className="text-[var(--color-text-primary)]">{rfq.reservePrice ?? '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">expiry</span>
            <span className="text-[var(--color-text-secondary)]">
              {rfq.expiryTimestamp ? new Date(Number(rfq.expiryTimestamp) * 1000).toLocaleDateString() : '-'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-tertiary)]">convertToLimit</span>
            <span className="text-[var(--color-text-secondary)]">{rfq.convertToLimitOrder ? 'yes' : 'no'}</span>
          </div>
          {rfq.winner && rfq.winner !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">winner</span>
              <span className="text-[var(--color-text-primary)]">{shortenAddress(rfq.winner)}</span>
            </div>
          )}
          {rfq.optionAddress && rfq.optionAddress !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">option</span>
              <a href={explorerAddress(rfq.optionAddress)} target="_blank" rel="noopener" className="text-[var(--color-text-link)] hover:underline">
                {shortenAddress(rfq.optionAddress)}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Offers */}
      <div className="px-3 py-2 border-t border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
        offers ({offersLoading ? '...' : offers.length})
      </div>
      <div className="p-3 space-y-1">
        {offersLoading && (
          <div className="text-xs text-[var(--color-text-tertiary)]">loading offers...</div>
        )}
        {!offersLoading && offers.length === 0 && (
          <div className="text-xs text-[var(--color-text-tertiary)]">no offers yet</div>
        )}
        {offers.map((offer: any, i: number) => (
          <OfferCard
            key={i}
            offer={offer}
            onAccept={stage === 'offer' && offer.decryptedAmount && offer.decryptedNonce ? () => {
              settleEarly(BigInt(quotationId), BigInt(offer.decryptedAmount), BigInt(offer.decryptedNonce), offer.offeror);
            } : undefined}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Actions */}
      {(canCancel || canSettle) && (
        <div className="px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
          {canCancel && (
            <button
              onClick={() => cancel(BigInt(quotationId))}
              disabled={isPending}
              className="px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-accent-red)] text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {isPending ? 'cancelling...' : 'cancel'}
            </button>
          )}
          {canSettle && (
            <button
              onClick={() => settle(BigInt(quotationId))}
              disabled={isPending}
              className="px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {isPending ? 'settling...' : 'settle'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
