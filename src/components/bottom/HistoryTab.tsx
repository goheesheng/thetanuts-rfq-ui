'use client';

import { useUserRFQs } from '@/hooks/useUserRFQs';
import { useWallet } from '@/hooks/useWallet';
import { useSettleRFQ } from '@/hooks/useSettleRFQ';
import StageBadge from '../common/StageBadge';
import { getRfqStage } from '@/lib/rfqUtils';
import { shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';

export default function HistoryTab() {
  const { address } = useWallet();
  const { rfqs, isLoading } = useUserRFQs();
  const { cancel, settle, isPending } = useSettleRFQ();

  if (!address) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to view history</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>;
  }

  const handleCancel = async (id: string | number) => {
    await cancel(BigInt(id));
  };

  const handleSettle = async (id: string | number) => {
    await settle(BigInt(id));
  };

  return (
    <div className="p-2">
      {rfqs.length === 0 ? (
        <div className="text-xs text-[var(--color-text-tertiary)] text-center py-4">no history</div>
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
                <th className="px-2 py-1 text-left">action</th>
              </tr>
            </thead>
            <tbody>
              {[...rfqs].sort((a: any, b: any) => (Number(b.updatedAt ?? 0)) - (Number(a.updatedAt ?? 0))).map((rfq: any, i: number) => {
                const stage = getRfqStage(rfq);
                const id = rfq.id ?? rfq.quotationId ?? i;
                const isActive = ['offer', 'reveal', 'post-reveal', 'limit'].includes(stage);
                const canCancel = isActive && rfq.requester?.toLowerCase() === address?.toLowerCase();
                const canSettle = stage === 'post-reveal' || stage === 'limit';

                return (
                  <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
                    <td className="px-2 py-1">#{id}</td>
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
                    <td className="px-2 py-1">
                      <div className="flex items-center gap-2">
                        {canCancel && (
                          <button
                            onClick={() => handleCancel(id)}
                            disabled={isPending}
                            className="text-[var(--color-accent-red)] hover:underline cursor-pointer bg-transparent border-none text-xs disabled:opacity-50"
                          >
                            cancel
                          </button>
                        )}
                        {canSettle && (
                          <button
                            onClick={() => handleSettle(id)}
                            disabled={isPending}
                            className="text-[var(--color-accent-green)] hover:underline cursor-pointer bg-transparent border-none text-xs disabled:opacity-50"
                          >
                            settle
                          </button>
                        )}
                        {!canCancel && !canSettle && (
                          <span className="text-[var(--color-text-tertiary)]">-</span>
                        )}
                      </div>
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
