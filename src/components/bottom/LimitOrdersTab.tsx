'use client';

import { useUserLimitOrders } from '@/hooks/useUserLimitOrders';
import { useSettleRFQ } from '@/hooks/useSettleRFQ';
import { useWallet } from '@/hooks/useWallet';
import StageBadge from '../common/StageBadge';
import { shortenAddress } from '@/lib/utils';

export default function LimitOrdersTab() {
  const { address } = useWallet();
  const { limitOrders, isLoading } = useUserLimitOrders();
  const { cancel, isPending } = useSettleRFQ();

  if (!address) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to view limit orders</div>;
  }

  if (isLoading) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>;
  }

  if (limitOrders.length === 0) {
    return <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">no active limit orders</div>;
  }

  return (
    <div className="p-2">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
              <th className="px-2 py-1 text-left">id</th>
              <th className="px-2 py-1 text-left">type</th>
              <th className="px-2 py-1 text-left">strikes</th>
              <th className="px-2 py-1 text-left">reserve</th>
              <th className="px-2 py-1 text-left">stage</th>
              <th className="px-2 py-1 text-left">action</th>
            </tr>
          </thead>
          <tbody>
            {limitOrders.map((rfq: any, i: number) => (
              <tr key={i} className="border-b border-[var(--color-border-subtle)]">
                <td className="px-2 py-1">#{rfq.id ?? rfq.quotationId}</td>
                <td className="px-2 py-1">{rfq.isRequestingLongPosition ? 'buy' : 'sell'}</td>
                <td className="px-2 py-1">{Array.isArray(rfq.strikes) ? rfq.strikes.join(', ') : '-'}</td>
                <td className="px-2 py-1">{rfq.currentBestPriceOrReserve ?? '-'}</td>
                <td className="px-2 py-1"><StageBadge stage="limit" /></td>
                <td className="px-2 py-1">
                  <button
                    onClick={() => cancel(BigInt(rfq.id ?? rfq.quotationId))}
                    disabled={isPending}
                    className="text-[var(--color-accent-red)] hover:underline cursor-pointer bg-transparent border-none text-xs disabled:opacity-50"
                  >
                    cancel
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
