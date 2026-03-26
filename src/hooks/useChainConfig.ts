'use client';

import { useMemo } from 'react';
import { useWallet } from './useWallet';
import { isChainIdSupported, getChainConfigById, DEFAULT_CHAIN_ID } from '../lib/chains';
import type { ChainConfig } from '@thetanuts-finance/thetanuts-client';

export function useChainConfig(): {
  config: ChainConfig;
  chainId: number;
  isSupported: boolean;
} {
  const { chainId: walletChainId } = useWallet();

  return useMemo(() => {
    const numericChainId = typeof walletChainId === 'number' ? walletChainId : DEFAULT_CHAIN_ID;
    const supported = isChainIdSupported(numericChainId);
    const effectiveChainId = supported ? numericChainId : DEFAULT_CHAIN_ID;

    return {
      config: getChainConfigById(effectiveChainId),
      chainId: effectiveChainId,
      isSupported: supported || walletChainId === null,
    };
  }, [walletChainId]);
}
