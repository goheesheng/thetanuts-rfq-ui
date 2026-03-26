'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import { useWallet } from './useWallet';
import { useSigningKey } from './useSigningKey';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastMMOfferSubmitting, toastMMOfferPlaced } from '@/lib/toastMessages';

// Store offers in localStorage for reveal phase
function storeOffer(address: string, quotationId: string, offerAmount: string, nonce: string) {
  const key = `mm:${address}:offers`;
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  stored[quotationId] = { offerAmount, nonce, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(stored));
}

export function getStoredOffer(address: string, quotationId: string): { offerAmount: string; nonce: string } | null {
  const key = `mm:${address}:offers`;
  const stored = JSON.parse(localStorage.getItem(key) || '{}');
  return stored[quotationId] || null;
}

export function useMMOffer() {
  const queryClient = useQueryClient();
  const { client } = useThetanutsClient();
  const { address, getSigner } = useWallet();
  const { keyPair, publicKey } = useSigningKey();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const makeOffer = useCallback(async (quotationId: string, offerAmount: bigint, requesterPublicKey: string) => {
    if (!address || !keyPair || !publicKey) {
      toast({ title: 'Connect wallet and ensure signing key', status: 'error' });
      return null;
    }

    setIsPending(true);
    setError(null);
    const toastId = toastMMOfferSubmitting();

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');

      const signerClient = createThetanutsClientWithSigner(signer);

      // Generate nonce
      const nonce = client.rfqKeys.generateNonce();

      // Encrypt offer
      const encrypted = await client.rfqKeys.encryptOffer(offerAmount, nonce, requesterPublicKey, keyPair);

      // Get EIP-712 domain
      const domain = await signerClient.optionFactory.getEip712Domain();

      // Sign offer via EIP-712
      const offerTypes = {
        Offer: [
          { name: 'quotationId', type: 'uint256' },
          { name: 'offerAmount', type: 'uint256' },
          { name: 'offeror', type: 'address' },
          { name: 'nonce', type: 'uint256' },
        ],
      };

      const offerValue = {
        quotationId: BigInt(quotationId),
        offerAmount,
        offeror: address,
        nonce,
      };

      const signature = await (signer as any).signTypedData(domain, offerTypes, offerValue);

      // Submit offer
      await signerClient.optionFactory.makeOfferForQuotation({
        quotationId: BigInt(quotationId),
        signature,
        signingKey: encrypted.signingKey,
        encryptedOffer: encrypted.ciphertext,
      });

      // Store for reveal phase
      storeOffer(address, quotationId, offerAmount.toString(), nonce.toString());

      toastMMOfferPlaced(toastId, quotationId);
      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
      return { quotationId, offerAmount: offerAmount.toString() };
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      setError(message);
      toast({ title, description: message, status: 'error' });
      return null;
    } finally {
      setIsPending(false);
    }
  }, [address, keyPair, publicKey, getSigner, client]);

  return { makeOffer, isPending, error };
}
