'use client';

import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';

export function useAllRfqs() {
  const { client } = useThetanutsClient();

  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: ['allFactoryRfqs'],
    queryFn: () => client.api.getAllFactoryRfqs(),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  return {
    rfqs: data ?? [],
    isLoading,
    error: error as Error | null,
    lastUpdated: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  };
}
