'use client';

import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useThetanutsClient } from './useThetanutsClient';
import { formatUnits } from '@/lib/utils';

const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

export function useCollateralBalance(tokenAddress: string | null, decimals: number = 18) {
  const { address } = useWallet();
  const { client, chainId } = useThetanutsClient();

  const { data: balance, isLoading, refetch } = useQuery({
    queryKey: ['collateralBalance', tokenAddress, address, chainId],
    queryFn: async () => {
      if (!tokenAddress || !address) return 0n;
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, client.provider);
      return (await contract.balanceOf(address)) as bigint;
    },
    enabled: !!tokenAddress && !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });

  return {
    balance: balance ?? 0n,
    formattedBalance: balance ? formatUnits(balance, decimals) : '0',
    isLoading,
    refetch,
  };
}
