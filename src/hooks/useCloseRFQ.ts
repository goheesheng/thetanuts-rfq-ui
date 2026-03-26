'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet } from './useWallet';
import { useSigningKey } from './useSigningKey';
import { createThetanutsClientWithSigner } from '@/lib/client';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastCloseSubmitting, toastCloseCreated } from '@/lib/toastMessages';
import { OPTION_FACTORY_ADDRESS } from '@/lib/constants';

export interface CloseRFQParams {
  existingOptionAddress: string;
  numContracts: string;          // raw on-chain BigInt string (exact)
  collateral: string;
  collateralPriceFeed: string;
  implementation: string;
  collateralDecimals: number;
  strikes: string[];             // raw on-chain BigInt strings (exact)
  expiry: number;                // unix timestamp
  isLong: boolean;               // flipped direction
  reservePrice: number;          // per-contract, human-readable
  fillOrKill?: boolean;
}

export function useCloseRFQ() {
  const queryClient = useQueryClient();
  const { address, getSigner } = useWallet();
  const { keyPair, publicKey } = useSigningKey();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (params: CloseRFQParams) => {
    if (!address || !publicKey || !keyPair) {
      toast({ title: 'Connect wallet first', status: 'error' });
      return null;
    }

    setIsPending(true);
    setError(null);

    const toastId = toastCloseSubmitting();

    try {
      const signer = await getSigner();
      if (!signer) throw new Error('Could not get signer');

      const signerClient = createThetanutsClientWithSigner(signer);

      // Use raw values directly — NO rounding, NO float conversion
      const numBn = BigInt(params.numContracts);
      const strikesOnChain = params.strikes.map(s => BigInt(s));
      const expiryBn = BigInt(params.expiry);

      // Reserve price: per-contract human-readable → total BigInt
      const priceBn = BigInt(Math.round(params.reservePrice * 10 ** params.collateralDecimals));
      const reservePriceBn = (priceBn * numBn) / BigInt(10 ** params.collateralDecimals);

      const nowTs = Math.floor(Date.now() / 1000);

      const request = {
        params: {
          requester: address as `0x${string}`,
          existingOptionAddress: params.existingOptionAddress as `0x${string}`,
          collateral: params.collateral as `0x${string}`,
          collateralPriceFeed: params.collateralPriceFeed as `0x${string}`,
          implementation: params.implementation as `0x${string}`,
          strikes: strikesOnChain,
          numContracts: numBn,
          requesterDeposit: 0n,
          collateralAmount: 0n,
          expiryTimestamp: expiryBn,
          offerEndTimestamp: BigInt(nowTs + 60),
          isRequestingLongPosition: params.isLong,
          convertToLimitOrder: params.fillOrKill ?? false,
          extraOptionData: '0x' as `0x${string}`,
        },
        tracking: { referralId: 0n, eventCode: 0n },
        reservePrice: reservePriceBn,
        requesterPublicKey: keyPair.compressedPublicKey,
      };

      // Ensure allowance for reserve price
      await signerClient.erc20.ensureAllowance(
        params.collateral as `0x${string}`,
        OPTION_FACTORY_ADDRESS as `0x${string}`,
        reservePriceBn,
      );

      // Dry run
      await signerClient.optionFactory.callStaticCreateRFQ(request);

      // Submit
      const receipt = await signerClient.optionFactory.requestForQuotation(request);

      const hash = receipt.hash;
      const qId = receipt.logs?.[0]?.topics?.[1];
      const parsedId = qId ? BigInt(qId).toString() : 'unknown';

      toastCloseCreated(toastId, parsedId, hash);

      queryClient.invalidateQueries({ queryKey: ['allFactoryRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['rfqState'] });
      queryClient.invalidateQueries({ queryKey: ['userRfqs'] });
      queryClient.invalidateQueries({ queryKey: ['userOffers'] });
      queryClient.invalidateQueries({ queryKey: ['userOptions'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
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
  }, [address, publicKey, keyPair, getSigner, queryClient]);

  return { submit, isPending, error };
}
