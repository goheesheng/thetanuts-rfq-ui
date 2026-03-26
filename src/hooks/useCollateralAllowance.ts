'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useThetanutsClient } from './useThetanutsClient';
import { OPTION_FACTORY_ADDRESS } from '@/lib/constants';
import { parseErrorMessage } from '@/lib/errors';
import { toast } from '@/lib/toast';
import { toastApproved, toastApprovalFailed } from '@/lib/toastMessages';

const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export function useCollateralAllowance(tokenAddress: string | null, decimals: number = 18) {
  const { address, getSigner } = useWallet();
  const { client, chainId } = useThetanutsClient();
  const [approving, setApproving] = useState(false);

  const { data: allowance, isLoading, refetch } = useQuery({
    queryKey: ['collateralAllowance', tokenAddress, address, chainId],
    queryFn: async () => {
      if (!tokenAddress || !address || !OPTION_FACTORY_ADDRESS) return 0n;
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, client.provider);
      return (await contract.allowance(address, OPTION_FACTORY_ADDRESS)) as bigint;
    },
    enabled: !!tokenAddress && !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  const approve = useCallback(async (amount: bigint) => {
    if (!tokenAddress || !OPTION_FACTORY_ADDRESS) return;
    setApproving(true);
    try {
      const signer = await getSigner();
      if (!signer) throw new Error('No signer');
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
      const tx = await contract.approve(OPTION_FACTORY_ADDRESS, amount);
      await tx.wait();
      toastApproved(tokenAddress.slice(0, 8));
      refetch();
    } catch (err: any) {
      const { message } = parseErrorMessage(err);
      toastApprovalFailed(message);
    } finally {
      setApproving(false);
    }
  }, [tokenAddress, getSigner, refetch]);

  const approveMax = useCallback(() => approve(ethers.MaxUint256), [approve]);

  const approveAmount = useCallback((amount: bigint) => approve(amount), [approve]);

  return {
    allowance: allowance ?? 0n,
    isApproved: (allowance ?? 0n) > 0n,
    isLoading,
    approving,
    approveMax,
    approveAmount,
    refetch,
  };
}
