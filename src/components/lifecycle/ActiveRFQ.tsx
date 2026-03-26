'use client';

import { useRFQDetail } from '@/hooks/useRFQDetail';
import { useSettleRFQ } from '@/hooks/useSettleRFQ';
import { useRfqStage } from '@/hooks/useRfqStage';
import StageBadge from '../common/StageBadge';
import CountdownTimer from '../common/CountdownTimer';
import OfferCard from './OfferCard';
import { formatRfqId } from '@/lib/rfqUtils';
import { shortenAddress, explorerAddress } from '@/lib/utils';

interface ActiveRFQProps {
  quotationId: string | null;
}

export default function ActiveRFQ({ quotationId }: ActiveRFQProps) {
  const { rfq, offers, isLoading } = useRFQDetail(quotationId);
  const { settleEarly, settle, cancel, isPending } = useSettleRFQ();
  const stage = useRfqStage(rfq);

  if (!quotationId) return null;

  if (isLoading) {
    return (
      <div className="border border-[var(--color-border)] p-3">
        <div className="text-xs text-[var(--color-text-tertiary)]">loading rfq {formatRfqId(quotationId)}...</div>
      </div>
    );
  }

  if (!rfq) {
    return (
      <div className="border border-[var(--color-border)] p-3">
        <div className="text-xs text-[var(--color-text-tertiary)]">rfq not found</div>
      </div>
    );
  }

  const offerEnd = Number(rfq.offerEndTimestamp ?? 0);

  return (
    <div className="border border-[var(--color-border)]">
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
          active rfq {formatRfqId(quotationId)}
        </span>
        <StageBadge stage={stage} />
      </div>

      <div className="p-3 space-y-2">
        {/* Status info */}
        <div className="text-xs space-y-0.5">
          {stage === 'offer' && offerEnd > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[var(--color-text-tertiary)]">offer deadline:</span>
              <CountdownTimer deadline={offerEnd} className="text-[var(--color-accent-green)]" />
            </div>
          )}
          {rfq.winner && rfq.winner !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">winner</span>
              <span className="text-[var(--color-text-primary)]">{shortenAddress(rfq.winner)}</span>
            </div>
          )}
          {rfq.optionAddress && rfq.optionAddress !== '0x0000000000000000000000000000000000000000' && (
            <div className="flex justify-between">
              <span className="text-[var(--color-text-tertiary)]">option</span>
              <a href={explorerAddress(rfq.optionAddress)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                {shortenAddress(rfq.optionAddress)}
              </a>
            </div>
          )}
        </div>

        {/* Offers */}
        {offers.length > 0 && (
          <div>
            <div className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1">
              offers ({offers.length})
            </div>
            <div className="space-y-1">
              {offers.map((offer: any, i: number) => (
                <OfferCard
                  key={i}
                  offer={offer}
                  onAccept={stage === 'offer' ? () => {
                    if (offer.decryptedAmount && offer.decryptedNonce) {
                      settleEarly(BigInt(quotationId), BigInt(offer.decryptedAmount), BigInt(offer.decryptedNonce), offer.offeror);
                    }
                  } : undefined}
                  isPending={isPending}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {stage === 'post-reveal' && (
            <button
              onClick={() => settle(BigInt(quotationId))}
              disabled={isPending}
              className="flex-1 px-2 py-1.5 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {isPending ? 'settling...' : 'settle'}
            </button>
          )}
          {(stage === 'offer' || stage === 'reveal') && (
            <button
              onClick={() => cancel(BigInt(quotationId))}
              disabled={isPending}
              className="flex-1 px-2 py-1.5 text-xs cursor-pointer border border-[var(--color-accent-red)] text-[var(--color-accent-red)] hover:bg-[var(--color-accent-red)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {isPending ? 'cancelling...' : 'cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
