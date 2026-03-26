'use client';

import { useMemo } from 'react';
import { useAllRfqs } from './useAllRfqs';
import { getRfqStage, type RfqStage } from '@/lib/rfqUtils';

export interface EnrichedRfq {
  rfq: any;
  stage: RfqStage;
}

export function useActiveRFQs(stageFilter?: RfqStage) {
  const { rfqs, isLoading, error, lastUpdated } = useAllRfqs();

  const enriched = useMemo(() => {
    const all: EnrichedRfq[] = rfqs.map((rfq: any) => ({
      rfq,
      stage: getRfqStage(rfq),
    }));

    // Filter to active only (offer, reveal, post-reveal, limit)
    const active = all.filter(
      (e) => ['offer', 'reveal', 'post-reveal', 'limit'].includes(e.stage)
    );

    if (stageFilter) {
      return active.filter((e) => e.stage === stageFilter);
    }

    return active;
  }, [rfqs, stageFilter]);

  const filterByStage = (stage: RfqStage) =>
    enriched.filter((e) => e.stage === stage);

  return { rfqs: enriched, filterByStage, isLoading, error, lastUpdated };
}
