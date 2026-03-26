'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import { useSigningKey } from './useSigningKey';

const EMPTY_OFFERS: any[] = [];

export function useRFQDetail(quotationId: string | null) {
  const { client } = useThetanutsClient();
  const { keyPair } = useSigningKey();
  const [decryptedOffers, setDecryptedOffers] = useState<any[]>([]);

  const { data, isLoading: rfqLoading } = useQuery({
    queryKey: ['rfqDetail', quotationId],
    queryFn: async () => {
      const result = await client.api.getRfq(quotationId!) as any;
      const rfq = result;
      const offers = result.offers ? Object.values(result.offers) : [];
      return { rfq, offers };
    },
    enabled: !!quotationId,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  const rfq = data?.rfq ?? null;
  const rawOffers = data?.offers ?? EMPTY_OFFERS;

  // Decrypt offers asynchronously when rfq or keyPair changes
  useEffect(() => {
    if (!rawOffers || rawOffers.length === 0) {
      setDecryptedOffers(EMPTY_OFFERS);
      return;
    }

    async function decryptAll() {
      const results = await Promise.all(
        rawOffers.map(async (offer: any) => {
          if (!keyPair || !offer.signedOfferForRequester) {
            return { ...offer, decryptedAmount: null };
          }
          try {
            const decrypted = await client.rfqKeys.decryptOffer(
              offer.signedOfferForRequester,
              offer.signingKey,
              keyPair
            );
            return { ...offer, decryptedAmount: decrypted.offerAmount, decryptedNonce: decrypted.nonce };
          } catch {
            return { ...offer, decryptedAmount: null };
          }
        })
      );
      setDecryptedOffers(results);
    }

    decryptAll();
  }, [rawOffers, keyPair, client]);

  return {
    rfq,
    offers: decryptedOffers,
    isLoading: rfqLoading,
  };
}
