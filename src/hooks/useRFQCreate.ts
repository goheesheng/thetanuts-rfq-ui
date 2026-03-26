'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import { useWallet } from './useWallet';
import { useSigningKey } from './useSigningKey';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastRFQSubmitting, toastRFQCreated } from '@/lib/toastMessages';
import type { RFQBuilderParams } from '@thetanuts-finance/thetanuts-client';

export interface RFQCreateParams {
  underlying: string;
  optionType: 'CALL' | 'PUT';
  strikes: number[];
  expiry: number;
  numContracts: number;
  isLong: boolean;
  collateralToken: string;
  reservePrice: number;
  offerDeadlineMinutes?: number;
  convertToLimitOrder?: boolean;
  existingOptionAddress?: string;
  isIronCondor?: boolean;
  isPhysical?: boolean;
  deliveryToken?: string;
}

export function useRFQCreate() {
  const queryClient = useQueryClient();
  const { client } = useThetanutsClient();
  const { address, getSigner } = useWallet();
  const { publicKey } = useSigningKey();
  const [isPending, setIsPending] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [quotationId, setQuotationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (params: RFQCreateParams) => {
    if (!address || !publicKey) {
      toast({ title: 'Connect wallet first', status: 'error' });
      return null;
    }

    setIsPending(true);
    setError(null);
    setTxHash(null);
    setQuotationId(null);

    const toastId = toastRFQSubmitting();

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('Could not get signer');

      const signerClient = createThetanutsClientWithSigner(signer);

      let request;

      if (params.isPhysical && params.deliveryToken) {
        request = signerClient.optionFactory.buildPhysicalOptionRFQ({
          requester: address as `0x${string}`,
          underlying: params.underlying as 'ETH' | 'BTC',
          optionType: params.optionType,
          strike: params.strikes[0],
          expiry: params.expiry,
          numContracts: params.numContracts,
          isLong: params.isLong,
          deliveryToken: params.deliveryToken as `0x${string}`,
          requesterPublicKey: publicKey,
          collateralToken: params.collateralToken as any,
          offerDeadlineMinutes: params.offerDeadlineMinutes ?? 120,
          reservePrice: params.reservePrice,
        });
      } else {
        const builderParams = {
          requester: address,
          underlying: params.underlying,
          optionType: params.optionType,
          strikes: params.strikes,
          expiry: params.expiry,
          numContracts: params.numContracts,
          isLong: params.isLong,
          collateralToken: params.collateralToken,
          reservePrice: params.reservePrice,
          requesterPublicKey: publicKey,
          offerDeadlineMinutes: params.offerDeadlineMinutes ?? 120,
          convertToLimitOrder: params.convertToLimitOrder ?? true,
          existingOptionAddress: params.existingOptionAddress,
          isIronCondor: params.isIronCondor,
        } as RFQBuilderParams;

        request = signerClient.optionFactory.buildRFQRequest(builderParams);
      }
      const receipt = await signerClient.optionFactory.requestForQuotation(request);

      const hash = receipt.hash;
      setTxHash(hash);

      // Parse quotationId from receipt logs
      const qId = receipt.logs?.[0]?.topics?.[1];
      const parsedId = qId ? BigInt(qId).toString() : 'unknown';
      setQuotationId(parsedId);

      toastRFQCreated(toastId, parsedId, hash);
      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['rfqDetail'] });
      return { txHash: hash, quotationId: parsedId };
    } catch (err: any) {
      const { title, message } = parseErrorMessage(err);
      setError(message);
      toast({ title, description: message, status: 'error' });
      return null;
    } finally {
      setIsPending(false);
    }
  }, [address, publicKey, getSigner]);

  return { submit, isPending, txHash, quotationId, error };
}
