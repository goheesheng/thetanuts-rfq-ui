'use client';

import { useMemo } from 'react';
import { useUserRFQs } from './useUserRFQs';
import { useWallet } from './useWallet';
import { getRfqStage } from '@/lib/rfqUtils';

export function useMMOfferHistory() {
  const { address } = useWallet();
  const { offers, isLoading } = useUserRFQs();

  const categorized = useMemo(() => {
    if (!address || !offers.length) return { activeOffers: [], revealedOffers: [], wonOffers: [], history: offers };

    // Get stored offers from localStorage
    const storedKey = `mm:${address}:offers`;
    const stored = JSON.parse(localStorage.getItem(storedKey) || '{}');

    const activeOffers = offers.filter((o: any) => o.status === 'pending');
    const revealedOffers = offers.filter((o: any) => o.status === 'revealed');
    const wonOffers = offers.filter((o: any) => o.status === 'accepted');

    return { activeOffers, revealedOffers, wonOffers, history: offers };
  }, [address, offers]);

  return { ...categorized, isLoading };
}
