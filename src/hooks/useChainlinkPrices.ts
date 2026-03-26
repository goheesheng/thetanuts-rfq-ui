'use client';

import { useQuery } from '@tanstack/react-query';
import { ethers } from 'ethers';
import { PRICE_FEEDS } from '@/lib/constants';
import { useThetanutsClient } from './useThetanutsClient';

// Multicall3 on Base (same address on all EVM chains)
const MULTICALL3 = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  'function aggregate3(tuple(address target, bool allowFailure, bytes callData)[] calls) view returns (tuple(bool success, bytes returnData)[])',
];

// Chainlink aggregators on Base all use 8 decimals
const CHAINLINK_DECIMALS = 8;

const AGG_IFACE = new ethers.Interface([
  'function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
]);

export function useChainlinkPrices() {
  const { client, chainId } = useThetanutsClient();

  return useQuery<Record<string, number>>({
    queryKey: ['chainlinkPrices', chainId],
    queryFn: async () => {
      const multicall = new ethers.Contract(MULTICALL3, MULTICALL3_ABI, client.provider);

      // Only primary symbols (skip legacy slash-format keys like 'ETH/USD')
      const feeds = Object.entries(PRICE_FEEDS).filter(([symbol]) => !symbol.includes('/'));

      // Build multicall: one latestRoundData() per feed
      const calls = feeds.map(([, feedAddress]) => ({
        target: feedAddress,
        allowFailure: true,
        callData: AGG_IFACE.encodeFunctionData('latestRoundData'),
      }));

      const rawResults: { success: boolean; returnData: string }[] = await multicall.aggregate3(calls);

      const results: Record<string, number> = {};
      for (let i = 0; i < feeds.length; i++) {
        const [symbol] = feeds[i];
        const result = rawResults[i];
        if (!result.success) continue;

        try {
          const [, answer] = AGG_IFACE.decodeFunctionResult('latestRoundData', result.returnData);
          results[symbol] = Number(answer) / 10 ** CHAINLINK_DECIMALS;
        } catch {
          // skip malformed responses
        }
      }

      return results;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}
