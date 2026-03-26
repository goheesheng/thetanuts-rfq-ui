'use client';

import { useState, useMemo } from 'react';
import { usePositions } from '@/hooks/usePositions';
import { useMMPricing } from '@/hooks/useMMPricing';
import { usePositionPricing } from '@/hooks/usePositionPricing';
import { useWallet } from '@/hooks/useWallet';
import { useSettleRFQ } from '@/hooks/useSettleRFQ';
import { useUserRFQs } from '@/hooks/useUserRFQs';
import { buildClosingRfqMap } from '@/lib/closingRfqs';
import StageBadge from '../common/StageBadge';
import { formatTokenAmount, formatPrice, shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';

interface PositionsPanelProps {
  onClose?: (position: any) => void;
}

const SUB_TABS = ['open', 'unfulfilled', 'closed', 'settled'] as const;
type SubTab = typeof SUB_TABS[number];

export default function PositionsPanel({ onClose }: PositionsPanelProps) {
  const { address } = useWallet();
  const { data: positions, isLoading } = usePositions();
  const { data: ethPricing } = useMMPricing('ETH');
  const { data: btcPricing } = useMMPricing('BTC');
  const positionsWithPricing = usePositionPricing(positions ?? [], ethPricing, btcPricing);
  const { cancel, isPending: isCancelling } = useSettleRFQ();
  const { rfqs } = useUserRFQs();
  const closingMap = useMemo(() => buildClosingRfqMap(rfqs), [rfqs]);
  const [subTab, setSubTab] = useState<SubTab>('unfulfilled');

  if (!address) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to view positions</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading positions...</div>;
  }

  const categorized = {
    open: positionsWithPricing.filter(p => p.position.optionStatus === 'active' && p.position.address),
    unfulfilled: positionsWithPricing.filter(p => !p.position.address && ['offer', 'reveal'].includes(p.position.stage)),
    closed: positionsWithPricing.filter(p => p.position.optionStatus === 'closed' || p.position.pnl?.some(e => e.exitType === 'rfq')),
    settled: positionsWithPricing.filter(p => p.position.optionStatus?.startsWith('settled-') || p.position.optionStatus === 'expired-awaiting-settlement'),
  };

  const activePositions = categorized[subTab];

  const handleCancel = async (quotationId: string | number) => {
    await cancel(BigInt(quotationId));
  };

  const formatStrikeDisplay = (strikes: string[]) => {
    return strikes.map(s => formatPrice(Number(s) / 1e8)).join(' / ');
  };

  const formatPnlDisplay = (pnlUSD: string, pnlPercent: string) => {
    const usd = Number(pnlUSD);
    const pct = Number(pnlPercent);
    const usdPrefix = usd >= 0 ? '+' : '-';
    const pctPrefix = pct >= 0 ? '+' : '-';
    return `${usdPrefix}$${Math.abs(usd).toFixed(2)} (${pctPrefix}${Math.abs(pct).toFixed(2)}%)`;
  };

  return (
    <div className="p-2">
      {/* Sub-tabs */}
      <div className="flex items-center gap-0 mb-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setSubTab(tab)}
            className={`px-2 py-0.5 text-[10px] cursor-pointer border border-[var(--color-border)] ${
              subTab === tab
                ? 'text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10'
                : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            {tab} ({categorized[tab].length})
          </button>
        ))}
      </div>

      {activePositions.length === 0 ? (
        <div className="text-xs text-[var(--color-text-tertiary)] text-center py-4">no {subTab} positions</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                <th className="px-2 py-1 text-left">id</th>
                <th className="px-2 py-1 text-left">side</th>
                <th className="px-2 py-1 text-left">underlying</th>
                <th className="px-2 py-1 text-left">implementation</th>
                <th className="px-2 py-1 text-left">stage</th>
                <th className="px-2 py-1 text-left">strikes</th>
                <th className="px-2 py-1 text-left">expiry</th>
                <th className="px-2 py-1 text-right">numContracts</th>
                <th className="px-2 py-1 text-left">collateral</th>
                <th className="px-2 py-1 text-right">premium</th>
                <th className="px-2 py-1 text-right">premiumUSD</th>
                <th className="px-2 py-1 text-right">entry</th>
                <th className="px-2 py-1 text-right">current</th>
                <th className="px-2 py-1 text-right">pnl</th>
                <th className="px-2 py-1 text-left">buyer</th>
                <th className="px-2 py-1 text-left">seller</th>
                <th className="px-2 py-1 text-left">option</th>
                <th className="px-2 py-1 text-left">fee</th>
                <th className="px-2 py-1 text-right">feeUSD</th>
                {(subTab === 'open' || subTab === 'unfulfilled') && <th className="px-2 py-1 text-left">action</th>}
              </tr>
            </thead>
            <tbody>
              {activePositions.map((pw, i) => {
                const p = pw.position;
                const implLabel = p.implementationName?.replace(/_/g, ' ').toLowerCase() || 'vanilla';
                return (
                  <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
                    <td className="px-2 py-1 font-mono text-[var(--color-text-tertiary)]">#{p.quotationId}</td>
                    <td className="px-2 py-1">
                      <span className={p.isBuyer ? 'pnl-positive' : 'pnl-negative'}>
                        {p.isBuyer ? 'long' : 'short'}
                      </span>
                    </td>
                    <td className="px-2 py-1">{p.underlyingAsset || '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{implLabel}</td>
                    <td className="px-2 py-1">
                      <span className="inline-flex items-center gap-1">
                        <StageBadge stage={p.stage} />
                        {p.address && closingMap.has(p.address.toLowerCase()) && (
                          <span className="text-[9px] px-1 py-0.5 bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border border-[var(--color-accent-blue)]/30">
                            CLOSING
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-2 py-1">{formatStrikeDisplay(p.strikes)}</td>
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                      {p.expiryTimestamp > 0 ? new Date(p.expiryTimestamp * 1000).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-2 py-1 text-right">{formatTokenAmount(Number(p.numContracts) / 10 ** p.collateralDecimals, 4)}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{p.collateralSymbol || shortenAddress(p.collateral)}</td>
                    <td className="px-2 py-1 text-right">
                      {(() => {
                        const premium = Number(p.currentBestPrice) / 10 ** p.collateralDecimals;
                        if (!premium) return '-';
                        return (
                          <span className={p.isBuyer ? 'pnl-negative' : 'pnl-positive'}>
                            {formatTokenAmount(premium, 4)} <span className="text-[var(--color-text-tertiary)]">{p.isBuyer ? 'paid' : 'rcvd'}</span>
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {pw.pnlResult && pw.pnlResult.premiumUSD !== '-' ? (
                        <span className={p.isBuyer ? 'pnl-negative' : 'pnl-positive'}>
                          {p.isBuyer ? '-' : '+'}${pw.pnlResult.premiumUSD}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {pw.pnlResult && pw.pnlResult.entryValueUSD !== '-' ? `$${pw.pnlResult.entryValueUSD}` : '-'}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {pw.pnlResult && pw.pnlResult.currentValueUSD !== '-' ? (
                        pw.pnlResult.currentValueTooltip ? (
                          <span className="relative group cursor-help border-b border-dashed border-[var(--color-border)]">
                            ${pw.pnlResult.currentValueUSD}
                            <span className="pointer-events-none absolute bottom-full right-0 mb-1 hidden group-hover:block whitespace-pre bg-[var(--color-surface-elevated,#1a1a2e)] text-[var(--color-text-secondary)] text-[10px] font-mono px-2 py-1.5 rounded border border-[var(--color-border)] shadow-lg z-50">
                              {pw.pnlResult.currentValueTooltip}
                            </span>
                          </span>
                        ) : (
                          <span>${pw.pnlResult.currentValueUSD}</span>
                        )
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1 text-right">
                      {pw.pnlResult && pw.pnlResult.pnlUSD !== '-' ? (
                        <span className={Number(pw.pnlResult.pnlUSD) >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                          {formatPnlDisplay(pw.pnlResult.pnlUSD, pw.pnlResult.pnlPercent)}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(p.buyer)}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(p.seller)}</td>
                    <td className="px-2 py-1">
                      {p.address ? (
                        <a href={explorerAddress(p.address)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                          {shortenAddress(p.address)}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1">{p.isBuyer ? '-' : (p.feeAmount !== '0' ? formatTokenAmount(Number(p.feeAmount) / 10 ** p.collateralDecimals, 6) : '-')}</td>
                    <td className="px-2 py-1 text-right">
                      {(() => {
                        if (p.isBuyer || p.feeAmount === '0') return '-';
                        const fee = Number(p.feeAmount) / 10 ** p.collateralDecimals;
                        const isBase = ['WETH', 'cbBTC'].includes(p.collateralSymbol);
                        const feeUsd = isBase ? fee * (p.assetPriceAtSettle ?? 0) : fee;
                        return feeUsd > 0 ? `$${feeUsd < 0.01 ? feeUsd.toFixed(10).replace(/0+$/, '').replace(/\.$/, '') : feeUsd.toFixed(2)}` : '-';
                      })()}
                    </td>
                    {subTab === 'open' && (
                      <td className="px-2 py-1">
                        {p.address && closingMap.has(p.address.toLowerCase()) ? (
                          <span className="text-[var(--color-text-tertiary)] text-xs">closing...</span>
                        ) : (
                          <button
                            onClick={() => onClose?.(p)}
                            className="text-[var(--color-accent-blue)] hover:underline cursor-pointer bg-transparent border-none text-xs"
                          >
                            close
                          </button>
                        )}
                      </td>
                    )}
                    {subTab === 'unfulfilled' && (
                      <td className="px-2 py-1">
                        <button
                          onClick={() => handleCancel(p.quotationId)}
                          disabled={isCancelling}
                          className="text-[var(--color-accent-red)] hover:underline cursor-pointer bg-transparent border-none text-xs disabled:opacity-50"
                        >
                          {isCancelling ? 'cancelling...' : 'cancel'}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
