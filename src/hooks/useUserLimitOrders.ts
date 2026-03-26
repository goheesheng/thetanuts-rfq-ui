'use client';

import { useMemo } from 'react';
import { useUserRFQs } from './useUserRFQs';
import { getRfqStage } from '@/lib/rfqUtils';

export function useUserLimitOrders() {
  const { rfqs, isLoading } = useUserRFQs();

  const limitOrders = useMemo(() => {
    return rfqs.filter((rfq: any) => {
      const stage = getRfqStage(rfq);
      return stage === 'limit' && rfq.convertToLimitOrder;
    });
  }, [rfqs]);

  return { limitOrders, isLoading };
}
