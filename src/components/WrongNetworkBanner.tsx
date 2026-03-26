'use client';

import { useChainConfig } from '../hooks/useChainConfig';
import { SUPPORTED_CHAIN_IDS, CHAIN_CONFIGS_BY_ID } from '../lib/chains';
import { useAppKitNetwork } from '@reown/appkit/react';

export default function WrongNetworkBanner() {
  const { isSupported } = useChainConfig();
  const { switchNetwork } = useAppKitNetwork();

  if (isSupported) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm px-4 py-3 flex items-center justify-between gap-4">
      <span>
        Unsupported network. Please switch to{' '}
        {SUPPORTED_CHAIN_IDS.map((id) => CHAIN_CONFIGS_BY_ID[id as keyof typeof CHAIN_CONFIGS_BY_ID].name).join(', ')}.
      </span>
      <button
        onClick={() => switchNetwork({ id: SUPPORTED_CHAIN_IDS[0], caipNetworkId: `eip155:${SUPPORTED_CHAIN_IDS[0]}`, chainNamespace: 'eip155', name: CHAIN_CONFIGS_BY_ID[SUPPORTED_CHAIN_IDS[0] as keyof typeof CHAIN_CONFIGS_BY_ID].name, nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: { default: { http: [] } } } as any)}
        className="shrink-0 px-3 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 text-xs font-medium transition-colors"
      >
        Switch Network
      </button>
    </div>
  );
}
