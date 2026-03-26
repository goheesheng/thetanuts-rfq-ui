'use client';

import { useOptionChain, type OptionChainRow } from '@/hooks/useOptionChain';
import AssetSelector from './AssetSelector';
import ExpirySelector from './ExpirySelector';
import ChainSkeleton from '../skeletons/ChainSkeleton';
import { formatPrice, formatTokenAmount } from '@/lib/utils';
import { useState } from 'react';

interface OptionChainProps {
  asset: 'ETH' | 'BTC';
  onAssetChange: (asset: 'ETH' | 'BTC') => void;
  onSelectOption: (params: {
    strike: number;
    expiry: number;
    isCall: boolean;
    isBid: boolean;
    pricing: any;
  }) => void;
  spotPrice?: number;
}

export default function OptionChain({ asset, onAssetChange, onSelectOption, spotPrice }: OptionChainProps) {
  const { expiries, rowsByExpiry, isLoading, error } = useOptionChain(asset);
  const [selectedExpiry, setSelectedExpiry] = useState<number | null>(null);

  // Auto-select first expiry
  const activeExpiry = selectedExpiry ?? expiries[0] ?? null;
  const rows = activeExpiry ? (rowsByExpiry[activeExpiry] ?? []) : [];

  if (isLoading) return <ChainSkeleton />;
  if (error) {
    return (
      <div className="border border-[var(--color-border)] p-4 text-xs text-[var(--color-accent-red)]">
        failed to load pricing: {error.message}
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)]">
      {/* Header bar */}
      <div className="flex items-center justify-between p-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <AssetSelector selected={asset} onChange={onAssetChange} />
          {spotPrice && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              spot: <span className="text-[var(--color-text-primary)]">{formatPrice(spotPrice)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Expiry tabs */}
      <div className="p-2 border-b border-[var(--color-border)]">
        <ExpirySelector
          expiries={expiries}
          selected={activeExpiry}
          onChange={setSelectedExpiry}
        />
      </div>

      {/* Option chain table */}
      {rows.length === 0 ? (
        <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">no options for this expiry</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                <th className="px-2 py-1.5 text-left">call bid</th>
                <th className="px-2 py-1.5 text-left">call ask</th>
                <th className="px-2 py-1.5 text-center font-bold text-[var(--color-text-secondary)]">strike</th>
                <th className="px-2 py-1.5 text-right">put bid</th>
                <th className="px-2 py-1.5 text-right">put ask</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <ChainRow
                  key={row.strike}
                  row={row}
                  expiry={activeExpiry!}
                  spotPrice={spotPrice}
                  onSelect={onSelectOption}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ChainRow({ row, expiry, spotPrice, onSelect }: {
  row: OptionChainRow;
  expiry: number;
  spotPrice?: number;
  onSelect: OptionChainProps['onSelectOption'];
}) {
  const callBid = row.call ? Object.values(row.call.byCollateral)[0]?.mmBidPriceBuffered : null;
  const callAsk = row.call ? Object.values(row.call.byCollateral)[0]?.mmAskPriceBuffered : null;
  const putBid = row.put ? Object.values(row.put.byCollateral)[0]?.mmBidPriceBuffered : null;
  const putAsk = row.put ? Object.values(row.put.byCollateral)[0]?.mmAskPriceBuffered : null;

  const isATM = spotPrice && Math.abs(row.strike - spotPrice) / spotPrice < 0.02;

  return (
    <tr className={`border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)] ${isATM ? 'bg-[var(--color-accent-blue)]/5' : ''}`}>
      <td className="px-2 py-1.5">
        {callBid ? (
          <button
            onClick={() => onSelect({ strike: row.strike, expiry, isCall: true, isBid: true, pricing: row.call })}
            className="text-[var(--color-accent-green)] hover:underline cursor-pointer bg-transparent border-none text-xs"
          >
            {formatTokenAmount(callBid)}
          </button>
        ) : <span className="text-[var(--color-text-tertiary)]">-</span>}
      </td>
      <td className="px-2 py-1.5">
        {callAsk ? (
          <button
            onClick={() => onSelect({ strike: row.strike, expiry, isCall: true, isBid: false, pricing: row.call })}
            className="text-[var(--color-accent-red)] hover:underline cursor-pointer bg-transparent border-none text-xs"
          >
            {formatTokenAmount(callAsk)}
          </button>
        ) : <span className="text-[var(--color-text-tertiary)]">-</span>}
      </td>
      <td className="px-2 py-1.5 text-center font-bold text-[var(--color-text-primary)]">
        {formatPrice(row.strike)}
      </td>
      <td className="px-2 py-1.5 text-right">
        {putBid ? (
          <button
            onClick={() => onSelect({ strike: row.strike, expiry, isCall: false, isBid: true, pricing: row.put })}
            className="text-[var(--color-accent-green)] hover:underline cursor-pointer bg-transparent border-none text-xs"
          >
            {formatTokenAmount(putBid)}
          </button>
        ) : <span className="text-[var(--color-text-tertiary)]">-</span>}
      </td>
      <td className="px-2 py-1.5 text-right">
        {putAsk ? (
          <button
            onClick={() => onSelect({ strike: row.strike, expiry, isCall: false, isBid: false, pricing: row.put })}
            className="text-[var(--color-accent-red)] hover:underline cursor-pointer bg-transparent border-none text-xs"
          >
            {formatTokenAmount(putAsk)}
          </button>
        ) : <span className="text-[var(--color-text-tertiary)]">-</span>}
      </td>
    </tr>
  );
}
