'use client';

import React, { createContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThetanutsClient } from '@thetanuts-finance/thetanuts-client';
import { getThetanutsClient } from './lib/client';
import { useChainConfig } from './hooks/useChainConfig';

import { initAppKit } from './config/appkit';

// Initialize AppKit before any component renders
initAppKit();


export interface ThetanutsContextValue {
  client: ThetanutsClient;
  chainId: number;
  isReady: boolean;
}

export const ThetanutsContext = createContext<ThetanutsContextValue | null>(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchInterval: 30_000,
    },
  },
});

function ThetanutsProvider({ children }: { children: React.ReactNode }) {
  const { chainId } = useChainConfig();
  const client = useMemo(() => getThetanutsClient(chainId), [chainId]);

  return (
    <ThetanutsContext.Provider value={{ client, chainId, isReady: true }}>
      {children}
    </ThetanutsContext.Provider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThetanutsProvider>
        {children}
      </ThetanutsProvider>
    </QueryClientProvider>
  );
}
