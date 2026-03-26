import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { defineChain } from '@reown/appkit/networks';
import { CHAIN_CONFIGS_BY_ID, SUPPORTED_CHAIN_IDS } from '../lib/chains';

const projectId = process.env.WALLET_CONNECT_PROJECT_ID || '';

if (!projectId) {
  console.warn('Missing WALLET_CONNECT_PROJECT_ID environment variable');
}

const isBrowser = typeof window !== 'undefined';

// Build network list dynamically from SDK chain configs
// In browser, route RPC through Next.js proxy to avoid rate-limited public endpoints
const appKitNetworks = SUPPORTED_CHAIN_IDS.map((chainId) => {
  const config = CHAIN_CONFIGS_BY_ID[chainId as keyof typeof CHAIN_CONFIGS_BY_ID];
  const rpcUrls = isBrowser
    ? [`${window.location.origin}/proxy/rpc/${chainId}`]
    : config.defaultRpcUrls;
  return defineChain({
    id: chainId,
    caipNetworkId: `eip155:${chainId}`,
    chainNamespace: 'eip155',
    name: config.name,
    nativeCurrency: { name: config.nativeCurrency, symbol: config.nativeCurrency, decimals: 18 },
    rpcUrls: {
      default: { http: rpcUrls },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: config.explorerUrl },
    },
  });
});

// Build custom RPC URLs for all chains — proxy in browser, public fallback on server
const customRpcUrls: Record<string, { url: string }[]> = {};
for (const chainId of SUPPORTED_CHAIN_IDS) {
  if (isBrowser) {
    customRpcUrls[`eip155:${chainId}`] = [{ url: `${window.location.origin}/proxy/rpc/${chainId}` }];
  } else {
    const config = CHAIN_CONFIGS_BY_ID[chainId as keyof typeof CHAIN_CONFIGS_BY_ID];
    customRpcUrls[`eip155:${chainId}`] = config.defaultRpcUrls.map((url) => ({ url }));
  }
}

// Guard against re-initialization on Fast Refresh full reloads.
// Without this, createAppKit re-registers Lit web components on every
// HMR cycle, causing "Multiple versions of Lit loaded" and broken CSS.
const g = globalThis as unknown as { __appkit_initialized?: boolean };

export function initAppKit() {
  if (g.__appkit_initialized) return;
  g.__appkit_initialized = true;

  createAppKit({
    adapters: [new EthersAdapter()],
    networks: appKitNetworks as any,
    projectId,
    defaultNetwork: appKitNetworks[0],
    enableEIP6963: true,
    enableNetworkSwitch: true,
    featuredWalletIds: [
      'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
      '541d5dcd4ede02f3afaf75bf8e3e4c4f1fb09edb5fa6c4377ebf31c2785d9adf', // OKX
      '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Ronin
    ],
    metadata: {
      name: 'Thetanuts RFQ',
      description: 'Trade on-chain options via RFQ — powered by Thetanuts Finance',
      url: typeof window !== 'undefined' ? window.location.origin : 'https://rfq.thetanuts.finance',
      icons: [],
    },
    features: {
      analytics: true,
      swaps: true,
      onramp: true,
    },
    customRpcUrls: customRpcUrls as any,
    themeMode: 'dark',
    themeVariables: {
      '--w3m-font-family': 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    },
  });
}
