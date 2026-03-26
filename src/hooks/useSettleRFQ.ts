'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastSettling, toastSettled, toastRFQCancelled } from '@/lib/toastMessages';

export function useSettleRFQ() {
  const queryClient = useQueryClient();
  const { getSigner } = useWallet();
  const [isPending, setIsPending] = useState(false);

  const settleEarly = useCallback(async (
    quotationId: bigint,
    offerAmount: bigint,
    nonce: bigint,
    offeror: string
  ) => {
    setIsPending(true);
    const toastId = toastSettling();
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');
      const signerClient = createThetanutsClientWithSigner(signer);
      await signerClient.optionFactory.settleQuotationEarly(quotationId, offerAmount, nonce, offeror);
      toastSettled(toastId);

      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      toast({ title, description: message, status: 'error' });
    } finally {
      setIsPending(false);
    }
  }, [getSigner]);

  const settle = useCallback(async (quotationId: bigint) => {
    setIsPending(true);
    const toastId = toastSettling();
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');
      const signerClient = createThetanutsClientWithSigner(signer);
      await signerClient.optionFactory.settleQuotation(quotationId);
      toastSettled(toastId);

      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      toast({ title, description: message, status: 'error' });
    } finally {
      setIsPending(false);
    }
  }, [getSigner]);

  const cancel = useCallback(async (quotationId: bigint) => {
    setIsPending(true);
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');
      const signerClient = createThetanutsClientWithSigner(signer);
      await signerClient.optionFactory.cancelQuotation(quotationId);
      toastRFQCancelled();

      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      toast({ title, description: message, status: 'error' });
    } finally {
      setIsPending(false);
    }
  }, [getSigner]);

  return { settleEarly, settle, cancel, isPending };
}
