'use client';

import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import { useWallet } from './useWallet';

export function useUserRFQs() {
  const { client } = useThetanutsClient();
  const { address } = useWallet();

  const rfqs = useQuery({
    queryKey: ['userRfqs', address],
    queryFn: () => client.api.getUserRfqs(address!),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const offers = useQuery({
    queryKey: ['userOffers', address],
    queryFn: () => client.api.getUserOffersFromRfq(address!),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const options = useQuery({
    queryKey: ['userOptions', address],
    queryFn: () => client.api.getUserOptionsFromRfq(address!),
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  return {
    rfqs: rfqs.data ?? [],
    offers: offers.data ?? [],
    options: options.data ?? [],
    isLoading: rfqs.isLoading || offers.isLoading || options.isLoading,
    error: rfqs.error || offers.error || options.error,
  };
}
