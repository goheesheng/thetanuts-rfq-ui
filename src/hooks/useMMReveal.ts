'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { getStoredOffer } from './useMMOffer';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastMMRevealSubmitting, toastMMRevealed } from '@/lib/toastMessages';

export function useMMReveal() {
  const queryClient = useQueryClient();
  const { address, getSigner } = useWallet();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reveal = useCallback(async (quotationId: string) => {
    if (!address) {
      toast({ title: 'Connect wallet first', status: 'error' });
      return;
    }

    const stored = getStoredOffer(address, quotationId);
    if (!stored) {
      toast({ title: 'No stored offer found for this RFQ', description: 'Offer data may have been cleared from localStorage', status: 'error' });
      return;
    }

    setIsPending(true);
    setError(null);
    const toastId = toastMMRevealSubmitting();

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');

      const signerClient = createThetanutsClientWithSigner(signer);

      await signerClient.optionFactory.revealOffer({
        quotationId: BigInt(quotationId),
        offerAmount: BigInt(stored.offerAmount),
        nonce: BigInt(stored.nonce),
        offeror: address,
      });

      toastMMRevealed(toastId, quotationId);
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
  }, [address, getSigner]);

  return { reveal, isPending, error };
}
