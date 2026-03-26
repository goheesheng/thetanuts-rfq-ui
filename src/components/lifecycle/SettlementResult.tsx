'use client';

import { shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';

interface SettlementResultProps {
  winner: string;
  optionAddress: string;
  txHash?: string;
}

export default function SettlementResult({ winner, optionAddress, txHash }: SettlementResultProps) {
  return (
    <div className="border border-[var(--color-accent-green)]/30 p-3 space-y-1 text-xs">
      <div className="text-[var(--color-accent-green)] text-[10px] uppercase tracking-wider">settlement complete</div>
      <div className="flex justify-between">
        <span className="text-[var(--color-text-tertiary)]">winner</span>
        <a href={explorerAddress(winner)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
          {shortenAddress(winner)}
        </a>
      </div>
      <div className="flex justify-between">
        <span className="text-[var(--color-text-tertiary)]">option</span>
        <a href={explorerAddress(optionAddress)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
          {shortenAddress(optionAddress)}
        </a>
      </div>
      {txHash && (
        <div className="flex justify-between">
          <span className="text-[var(--color-text-tertiary)]">tx</span>
          <a href={explorerTx(txHash)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
            {shortenAddress(txHash)}
          </a>
        </div>
      )}
    </div>
  );
}
