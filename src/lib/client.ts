'use client';

import { ethers } from 'ethers';
import { ThetanutsClient, getChainConfigById, type SupportedChainId } from '@thetanuts-finance/thetanuts-client';
import { DEFAULT_CHAIN_ID } from './chains';
import { getRpcUrl } from './rpc';

const clientCache = new Map<number, ThetanutsClient>();
const isBrowser = typeof window !== 'undefined';

function getApiBaseUrl(chainId: number): string {
  if (isBrowser) {
    return `${window.location.origin}/proxy/api/${chainId}`;
  }
  return getChainConfigById(chainId).apiBaseUrl;
}

function getIndexerApiUrl(chainId: number): string {
  if (isBrowser) {
    return `${window.location.origin}/proxy/indexer/${chainId}/api/v1`;
  }
  return getChainConfigById(chainId).indexerApiUrl;
}

function getStateApiUrl(chainId: number): string {
  if (isBrowser) {
    return `${window.location.origin}/proxy/state/${chainId}`;
  }
  return getChainConfigById(chainId).stateApiUrl;
}

export function getThetanutsClient(chainId: number = DEFAULT_CHAIN_ID): ThetanutsClient {
  const cached = clientCache.get(chainId);
  if (cached) return cached;

  const chainConfig = getChainConfigById(chainId);
  const rpcUrl = getRpcUrl(chainId);
  const network = new ethers.Network(chainConfig.name.toLowerCase(), chainId);

  const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: network,
  });

  const client = new ThetanutsClient({
    chainId: chainId as SupportedChainId,
    provider,
    apiBaseUrl: getApiBaseUrl(chainId),
    indexerApiUrl: getIndexerApiUrl(chainId),
    stateApiUrl: getStateApiUrl(chainId),
  });

  clientCache.set(chainId, client);

  if (isBrowser) {
    (window as any).thetanutsClient = client;
  }

  return client;
}

export function createThetanutsClientWithSigner(signer: ethers.Signer, chainId: number = DEFAULT_CHAIN_ID): ThetanutsClient {
  const chainConfig = getChainConfigById(chainId);
  const rpcUrl = getRpcUrl(chainId);
  const network = new ethers.Network(chainConfig.name.toLowerCase(), chainId);

  const provider = new ethers.JsonRpcProvider(rpcUrl, network, {
    staticNetwork: network,
  });

  return new ThetanutsClient({
    chainId: chainId as SupportedChainId,
    provider,
    signer,
    referrer: process.env.REFERRER_ADDRESS || '',
    apiBaseUrl: getApiBaseUrl(chainId),
    indexerApiUrl: getIndexerApiUrl(chainId),
    stateApiUrl: getStateApiUrl(chainId),
  });
}

export function resetClient(chainId?: number): void {
  if (chainId !== undefined) {
    clientCache.delete(chainId);
  } else {
    clientCache.clear();
  }
}
