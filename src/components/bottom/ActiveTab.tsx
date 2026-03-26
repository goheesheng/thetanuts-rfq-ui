'use client';

import { useState, useEffect, useMemo } from 'react';
import { useUserRFQs } from '@/hooks/useUserRFQs';
import { useWallet } from '@/hooks/useWallet';
import { getRfqStage } from '@/lib/rfqUtils';
import { isClosingRfq } from '@/lib/closingRfqs';
import { shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';
import StageBadge from '../common/StageBadge';
import CountdownTimer from '../common/CountdownTimer';
import ActiveRFQCard from './ActiveRFQCard';

interface ActiveTabProps {
  expandRfqId?: string | null;
}

export default function ActiveTab({ expandRfqId }: ActiveTabProps) {
  const { address } = useWallet();
  const { rfqs, isLoading } = useUserRFQs();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  // Active = any RFQ that is not settled or cancelled
  const activeRfqs = useMemo(() => {
    return rfqs.filter((rfq: any) => {
      const stage = getRfqStage(rfq);
      return ['offer', 'reveal', 'post-reveal', 'limit'].includes(stage);
    });
  }, [rfqs]);

  // Auto-expand newly created RFQ
  useEffect(() => {
    if (expandRfqId) {
      setExpandedId(expandRfqId);
      setHighlightId(expandRfqId);
      // Clear highlight after animation
      const timer = setTimeout(() => setHighlightId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [expandRfqId]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  if (!address) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to view active rfqs</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>;
  }

  if (activeRfqs.length === 0) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">no active rfqs</div>;
  }

  return (
    <div className="p-2">
      <div className="space-y-0">
        {activeRfqs.map((rfq: any) => {
          const id = (rfq.id ?? rfq.quotationId ?? '').toString();
          const stage = getRfqStage(rfq);
          const isExpanded = expandedId === id;
          const isHighlighted = highlightId === id;
          const offerEnd = Number(rfq.offerEndTimestamp ?? 0);
          const side = rfq.isRequestingLongPosition ? 'buy' : 'sell';
          const optionType = rfq.optionType ?? '-';
          const strikesStr = Array.isArray(rfq.strikes) ? rfq.strikes.join('/') : '-';

          return (
            <div key={id}>
              {/* Collapsed row */}
              <div
                onClick={() => toggleExpand(id)}
                className={`px-3 py-2 flex items-center justify-between text-xs border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] cursor-pointer ${
                  isHighlighted ? 'animate-pulse bg-[var(--color-accent-green)]/10' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[var(--color-text-tertiary)] shrink-0">
                    {isExpanded ? '▾' : '▸'}
                  </span>
                  <span className="text-[var(--color-text-secondary)] shrink-0">#{id}</span>
                  <StageBadge stage={stage} />
                  {isClosingRfq(rfq) && (
                    <span className="text-[10px] text-[var(--color-accent-blue)]">[close]</span>
                  )}
                  <span className={side === 'buy' ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                    {side}
                  </span>
                  <span className="text-[var(--color-text-primary)]">{optionType}</span>
                  <span className="text-[var(--color-text-secondary)]">${strikesStr}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {stage === 'offer' && offerEnd > 0 && (
                    <CountdownTimer deadline={offerEnd} className="text-[var(--color-accent-green)]" />
                  )}
                  {stage === 'limit' && (
                    <span className="text-[var(--color-text-tertiary)]">standing</span>
                  )}
                </div>
              </div>

              {/* Expanded section */}
              {isExpanded && (
                <ActiveRFQCard rfq={rfq} quotationId={id} stage={stage} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
