'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastMMLimitSettling, toastMMLimitSettled } from '@/lib/toastMessages';

export function useMMSettle() {
  const queryClient = useQueryClient();
  const { getSigner } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const settle = useCallback(async (quotationId: string) => {
    setIsPending(true);
    setError(null);
    const toastId = toastMMLimitSettling();

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');

      const signerClient = createThetanutsClientWithSigner(signer);
      await signerClient.optionFactory.settleQuotation(BigInt(quotationId));

      toastMMLimitSettled(toastId, quotationId);
      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      setError(message);
      toast({ title, description: message, status: 'error' });
    } finally {
      setIsPending(false);
    }
  }, [getSigner]);

  return { settle, isPending, error };
}
