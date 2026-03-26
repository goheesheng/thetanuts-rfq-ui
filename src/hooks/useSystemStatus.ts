'use client';

import { useState, useEffect, useCallback } from 'react';
import { useChainConfig } from './useChainConfig';

export type ServiceStatus = 'checking' | 'ok' | 'degraded' | 'down';

export interface SystemStatus {
  rpc: { status: ServiceStatus; latency: number | null; blockNumber: number | null };
  api: { status: ServiceStatus; latency: number | null };
}

const CHECK_INTERVAL = 30_000;
const INITIAL: SystemStatus = {
  rpc: { status: 'checking', latency: null, blockNumber: null },
  api: { status: 'checking', latency: null },
};

async function checkRpc(rpcUrl: string): Promise<SystemStatus['rpc']> {
  const start = performance.now();
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 }),
    });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) return { status: 'down', latency, blockNumber: null };
    const json = await res.json();
    const blockNumber = parseInt(json.result, 16);
    return { status: 'ok', latency, blockNumber };
  } catch {
    return { status: 'down', latency: null, blockNumber: null };
  }
}

async function checkApi(path: string): Promise<{ status: ServiceStatus; latency: number | null }> {
  const start = performance.now();
  try {
    const res = await fetch(path, { method: 'GET', cache: 'no-cache' });
    const latency = Math.round(performance.now() - start);
    if (!res.ok) return { status: 'down', latency };
    return { status: 'ok', latency };
  } catch {
    return { status: 'down', latency: null };
  }
}

export function useSystemStatus(): SystemStatus {
  const { chainId } = useChainConfig();
  const [status, setStatus] = useState<SystemStatus>(INITIAL);

  const runChecks = useCallback(async () => {
    const rpcUrl = `/proxy/rpc/${chainId}`;
    const [rpc, api] = await Promise.all([
      checkRpc(rpcUrl),
      checkApi(`/proxy/api/${chainId}/api/v1/market-data`),
    ]);
    setStatus({ rpc, api });
  }, [chainId]);

  useEffect(() => {
    runChecks();
    const id = setInterval(runChecks, CHECK_INTERVAL);
    return () => clearInterval(id);
  }, [runChecks]);

  return status;
}

export const STATUS_DOT_CLASS: Record<ServiceStatus, string> = {
  checking: 'bg-white/25 animate-pulse',
  ok: 'bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]',
  degraded: 'bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]',
  down: 'bg-red-400 shadow-[0_0_4px_rgba(248,113,113,0.4)]',
};

export const STATUS_LABEL: Record<ServiceStatus, string> = {
  checking: 'Checking',
  ok: 'OK',
  degraded: 'Degraded',
  down: 'Down',
};

export function overallStatus(s: SystemStatus): ServiceStatus {
  const all = [s.rpc.status, s.api.status];
  if (all.every((v) => v === 'ok')) return 'ok';
  if (all.some((v) => v === 'down')) return 'down';
  if (all.some((v) => v === 'checking')) return 'checking';
  return 'degraded';
}
