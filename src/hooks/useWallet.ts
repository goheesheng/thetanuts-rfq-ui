'use client';

import { useAppKit, useAppKitAccount, useAppKitNetwork, useAppKitProvider, useDisconnect } from '@reown/appkit/react';
import { ethers } from 'ethers';
import { useCallback } from 'react';

/**
 * Patch a signer's sendTransaction to use raw eth_sendTransaction,
 * avoiding ethers v6's TransactionResponse construction which fails
 * on MetaMask when the provider returns nonce=undefined.
 */
function patchSignerSendTransaction(
  signer: ethers.JsonRpcSigner,
  browserProvider: ethers.BrowserProvider,
): ethers.JsonRpcSigner {
  (signer as any).sendTransaction = async (tx: ethers.TransactionRequest) => {
    const from = await signer.getAddress();
    const hash: string = await browserProvider.send("eth_sendTransaction", [{
      from,
      to: tx.to,
      data: tx.data,
      ...(tx.gasLimit != null && { gas: '0x' + BigInt(tx.gasLimit).toString(16) }),
      ...(tx.value != null && BigInt(tx.value) > 0n && { value: '0x' + BigInt(tx.value).toString(16) }),
    }]);

    return new ethers.TransactionResponse({
      hash,
      blockNumber: null,
      blockHash: null,
      index: 0,
      type: 2,
      from,
      to: (tx.to as string) ?? null,
      nonce: 0,
      gasLimit: tx.gasLimit ? BigInt(tx.gasLimit) : 0n,
      gasPrice: null,
      maxPriorityFeePerGas: null,
      maxFeePerGas: null,
      data: (tx.data as string) ?? '0x',
      value: tx.value ? BigInt(tx.value) : 0n,
      chainId: 8453n,
      signature: ethers.Signature.from('0x' + '00'.repeat(65)),
      accessList: null,
      authorizationList: null,
    } as any, browserProvider);
  };
  return signer;
}

export function useWallet() {
  try {
    const { open } = useAppKit();
    const { address, isConnected } = useAppKitAccount();
    const { chainId } = useAppKitNetwork();
    const { walletProvider } = useAppKitProvider('eip155');
    const { disconnect: appKitDisconnect } = useDisconnect();

    const connect = useCallback(() => open({ view: 'Connect' }), [open]);
    const disconnect = useCallback(async () => appKitDisconnect(), [appKitDisconnect]);

    const getBrowserProvider = useCallback((): ethers.BrowserProvider | null => {
      if (!walletProvider) return null;
      return new ethers.BrowserProvider(walletProvider as any);
    }, [walletProvider]);

    const getSigner = useCallback(async (): Promise<ethers.Signer | null> => {
      const provider = getBrowserProvider();
      if (!provider) return null;
      const signer = await provider.getSigner();
      return patchSignerSendTransaction(signer, provider);
    }, [getBrowserProvider]);

    /**
     * Send a transaction via the wallet and return the tx hash.
     * Uses raw eth_sendTransaction to avoid ethers v6's TransactionResponse
     * construction which fails on MetaMask (nonce=undefined in response).
     */
    const sendTransaction = useCallback(async (tx: { to: string; data: string }): Promise<string> => {
      if (!walletProvider || !address) throw new Error('Wallet not connected');
      const provider = getBrowserProvider()!;
      return provider.send("eth_sendTransaction", [{ from: address, ...tx }]);
    }, [walletProvider, address, getBrowserProvider]);

    return {
      address: address ?? null,
      isConnected,
      chainId: chainId ?? null,
      walletProvider,
      connect,
      disconnect,
      getSigner,
      sendTransaction,
    };
  } catch {
    // AppKit hooks can throw during Fast Refresh full reloads when
    // useAppKit() fires before createAppKit() re-initializes.
    // Return disconnected defaults — next render cycle recovers.
    return {
      address: null as string | null,
      isConnected: false,
      chainId: null as number | null,
      walletProvider: null,
      connect: () => {},
      disconnect: async () => {},
      getSigner: async () => null as ethers.Signer | null,
      sendTransaction: async () => '' as string,
    };
  }
}
