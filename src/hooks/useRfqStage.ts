'use client';

import { useState, useEffect } from 'react';
import { getRfqStage, type RfqStage } from '@/lib/rfqUtils';

/** Compute and auto-update RFQ lifecycle stage from timestamps */
export function useRfqStage(rfq: any | null): RfqStage {
  const [stage, setStage] = useState<RfqStage>(() => getRfqStage(rfq));

  useEffect(() => {
    if (!rfq) return;
    setStage(getRfqStage(rfq));
    // Re-compute every second for countdown accuracy
    const id = setInterval(() => setStage(getRfqStage(rfq)), 1000);
    return () => clearInterval(id);
  }, [rfq]);

  return stage;
}
