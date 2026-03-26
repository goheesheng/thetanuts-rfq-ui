'use client';

import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import type { MMVanillaPricing } from '@thetanuts-finance/thetanuts-client';

export function useMMPricing(underlying: 'ETH' | 'BTC') {
  const { client } = useThetanutsClient();

  return useQuery<Record<string, MMVanillaPricing>>({
    queryKey: ['mmPricing', underlying],
    queryFn: () => client.mmPricing.getAllPricing(underlying),
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}
