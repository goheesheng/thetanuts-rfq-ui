'use client';

import { useMemo } from 'react';
import { useMMPricing } from './useMMPricing';
import type { MMVanillaPricing } from '@thetanuts-finance/thetanuts-client';

export interface OptionChainRow {
  strike: number;
  call?: MMVanillaPricing;
  put?: MMVanillaPricing;
}

export interface OptionChainData {
  expiries: number[];
  rowsByExpiry: Record<number, OptionChainRow[]>;
  isLoading: boolean;
  error: Error | null;
}

export function useOptionChain(underlying: 'ETH' | 'BTC'): OptionChainData {
  const { data: pricing, isLoading, error } = useMMPricing(underlying);

  const { expiries, rowsByExpiry } = useMemo(() => {
    if (!pricing) return { expiries: [], rowsByExpiry: {} };

    // Group by expiry, then by strike, pairing calls/puts
    const expiryMap: Record<number, Record<number, { call?: MMVanillaPricing; put?: MMVanillaPricing }>> = {};

    for (const [, p] of Object.entries(pricing)) {
      const expiry = p.expiry;
      const strike = p.strike;
      if (!expiryMap[expiry]) expiryMap[expiry] = {};
      if (!expiryMap[expiry][strike]) expiryMap[expiry][strike] = {};
      if (p.isCall) {
        expiryMap[expiry][strike].call = p;
      } else {
        expiryMap[expiry][strike].put = p;
      }
    }

    const expiries = Object.keys(expiryMap).map(Number).sort((a, b) => a - b);
    const rowsByExpiry: Record<number, OptionChainRow[]> = {};

    for (const expiry of expiries) {
      const strikeMap = expiryMap[expiry];
      const strikes = Object.keys(strikeMap).map(Number).sort((a, b) => a - b);
      rowsByExpiry[expiry] = strikes.map((strike) => ({
        strike,
        call: strikeMap[strike].call,
        put: strikeMap[strike].put,
      }));
    }

    return { expiries, rowsByExpiry };
  }, [pricing]);

  return { expiries, rowsByExpiry, isLoading, error: error as Error | null };
}
