import { getChainConfigById } from '@thetanuts-finance/thetanuts-client';

const isBrowser = typeof window !== 'undefined';

/**
 * Get the RPC URL for a chain.
 * In browser: uses /proxy/rpc/{chainId} so the Ankr key stays server-side.
 * On server / fallback: uses SDK's public defaultRpcUrls.
 */
export function getRpcUrl(chainId: number): string {
  if (isBrowser) {
    return `${window.location.origin}/proxy/rpc/${chainId}`;
  }
  return getChainConfigById(chainId).defaultRpcUrls[0];
}
