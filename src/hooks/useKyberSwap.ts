'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './useWallet';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastSwapQuote, toastSwapAndRFQ } from '@/lib/toastMessages';

export interface KyberQuote {
  inputAmount: string;
  outputAmount: string;
  totalGas: string;
  gasUsd: string;
  encodedSwapData: string;
}

const KYBER_BASE_URL = process.env.KYBER_SWAP_URL || 'https://web.thetanuts.finance/kyber/';

export function useKyberSwap() {
  const { address, getSigner } = useWallet();
  const [quote, setQuote] = useState<KyberQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchQuote = useCallback(async (
    chainId: number,
    tokenIn: string,
    tokenOut: string,
    amountIn: string,
    slippageTolerance: number = 10
  ): Promise<KyberQuote | null> => {
    if (!address) return null;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        chainId: chainId.toString(),
        tokenIn,
        tokenOut,
        amountIn,
        to: address,
        slippageTolerance: slippageTolerance.toString(),
        saveGas: '0',
        gasInclude: '1',
        gasPrice: '1000000000',
      });

      const res = await fetch(`${KYBER_BASE_URL}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch Kyber quote');
      const data = await res.json();

      const q: KyberQuote = {
        inputAmount: data.inputAmount,
        outputAmount: data.outputAmount,
        totalGas: data.totalGas,
        gasUsd: data.gasUsd,
        encodedSwapData: data.encodedSwapData,
      };

      setQuote(q);
      return q;
    } catch (err) {
      console.error('Kyber quote error:', err);
      toast({ title: 'Failed to fetch swap quote', status: 'error' });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return { fetchQuote, quote, isLoading };
}
