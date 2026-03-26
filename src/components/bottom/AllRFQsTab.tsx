'use client';

import { useAllRfqs } from '@/hooks/useAllRfqs';
import StageBadge from '../common/StageBadge';
import { getRfqStage } from '@/lib/rfqUtils';
import { shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';

export default function AllRFQsTab() {
  const { rfqs, isLoading, lastUpdated } = useAllRfqs();

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--color-text-tertiary)]">
          all rfqs (global, 10s poll)
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {rfqs.length} rfqs{lastUpdated ? ` · last: ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">loading...</div>
      ) : rfqs.length === 0 ? (
        <div className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">no rfqs</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                <th className="px-2 py-1 text-left">id</th>
                <th className="px-2 py-1 text-left">stage</th>
                <th className="px-2 py-1 text-left">status</th>
                <th className="px-2 py-1 text-left">requester</th>
                <th className="px-2 py-1 text-left">side</th>
                <th className="px-2 py-1 text-left">optionType</th>
                <th className="px-2 py-1 text-left">implementation</th>
                <th className="px-2 py-1 text-left">strikes</th>
                <th className="px-2 py-1 text-left">numContracts</th>
                <th className="px-2 py-1 text-left">collateral</th>
                <th className="px-2 py-1 text-left">collateralPriceFeed</th>
                <th className="px-2 py-1 text-left">reservePrice</th>
                <th className="px-2 py-1 text-left">currentBestPrice</th>
                <th className="px-2 py-1 text-left">expiryTimestamp</th>
                <th className="px-2 py-1 text-left">offerEndTimestamp</th>
                <th className="px-2 py-1 text-left">convertToLimit</th>
                <th className="px-2 py-1 text-left">existingOption</th>
                <th className="px-2 py-1 text-left">winner</th>
                <th className="px-2 py-1 text-left">optionAddress</th>
                <th className="px-2 py-1 text-left">feeAmount</th>
                <th className="px-2 py-1 text-left">createdAt</th>
                <th className="px-2 py-1 text-left">updatedAt</th>
                <th className="px-2 py-1 text-left">createdTx</th>
                <th className="px-2 py-1 text-left">closedTx</th>
              </tr>
            </thead>
            <tbody>
              {[...rfqs].sort((a: any, b: any) => (Number(b.updatedAt ?? 0)) - (Number(a.updatedAt ?? 0))).map((rfq: any, i: number) => {
                const stage = getRfqStage(rfq);
                return (
                  <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
                    <td className="px-2 py-1">#{rfq.id ?? rfq.quotationId ?? i}</td>
                    <td className="px-2 py-1"><StageBadge stage={stage} /></td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{rfq.status ?? '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(rfq.requester)}</td>
                    <td className="px-2 py-1">{rfq.isRequestingLongPosition ? 'buy' : 'sell'}</td>
                    <td className="px-2 py-1">{rfq.optionType ?? '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{rfq.implementation ?? '-'}</td>
                    <td className="px-2 py-1">{Array.isArray(rfq.strikes) ? rfq.strikes.join(', ') : '-'}</td>
                    <td className="px-2 py-1">{rfq.numContracts ?? '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(rfq.collateral)}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(rfq.collateralPriceFeed)}</td>
                    <td className="px-2 py-1">{rfq.reservePrice ?? '-'}</td>
                    <td className="px-2 py-1">{rfq.currentBestPrice ?? '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                      {rfq.expiryTimestamp ? new Date(Number(rfq.expiryTimestamp) * 1000).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                      {rfq.offerEndTimestamp ? new Date(Number(rfq.offerEndTimestamp) * 1000).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-1">{rfq.convertToLimitOrder ? 'yes' : 'no'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(rfq.existingOptionAddress)}</td>
                    <td className="px-2 py-1 text-[var(--color-text-secondary)]">{shortenAddress(rfq.winner)}</td>
                    <td className="px-2 py-1">
                      {rfq.optionAddress ? (
                        <a href={explorerAddress(rfq.optionAddress)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                          {shortenAddress(rfq.optionAddress)}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1">{rfq.feeAmount ?? '-'}</td>
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                      {rfq.createdAt ? new Date(Number(rfq.createdAt) * 1000).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                      {rfq.updatedAt ? new Date(Number(rfq.updatedAt) * 1000).toLocaleString() : '-'}
                    </td>
                    <td className="px-2 py-1">
                      {rfq.createdTx ? (
                        <a href={explorerTx(rfq.createdTx)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                          {shortenAddress(rfq.createdTx)}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-2 py-1">
                      {rfq.closedTx ? (
                        <a href={explorerTx(rfq.closedTx)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                          {shortenAddress(rfq.closedTx)}
                        </a>
                      ) : '-'}
                    </td>
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
