'use client';

import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';

export function useRFQPolling() {
  const { client } = useThetanutsClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['rfqState'],
    queryFn: async () => {
      const [rfqs, offers, options, protocolStats] = await Promise.all([
        client.api.getAllFactoryRfqs(),
        client.api.getAllFactoryOffers(),
        client.api.getAllFactoryOptions(),
        client.api.getFactoryStats(),
      ]);
      return { rfqs, offers, options, protocolStats };
    },
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  return {
    rfqs: data?.rfqs ?? [],
    offers: data?.offers ?? [],
    options: data?.options ?? [],
    protocolStats: data?.protocolStats ?? null,
    isLoading,
    error: error as Error | null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
