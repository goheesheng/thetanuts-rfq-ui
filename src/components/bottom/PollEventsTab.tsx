'use client';

import { useMemo } from 'react';
import { useRFQPolling } from '@/hooks/useRFQPolling';
import StageBadge from '../common/StageBadge';
import { getRfqStage } from '@/lib/rfqUtils';
import { shortenAddress, explorerAddress, explorerTx } from '@/lib/utils';

interface UnifiedEvent {
  type: 'rfq' | 'offer' | 'option';
  timestamp: number;
  data: any;
}

const TYPE_COLORS: Record<string, string> = {
  rfq: 'var(--color-accent-green)',
  offer: 'var(--color-accent-blue)',
  option: 'var(--color-text-primary)',
};

export default function PollEventsTab() {
  const { rfqs, offers, options, isLoading, lastUpdated } = useRFQPolling();

  const events = useMemo(() => {
    const all: UnifiedEvent[] = [];

    for (const rfq of rfqs) {
      all.push({
        type: 'rfq',
        timestamp: Number(rfq.updatedAt ?? rfq.createdAt ?? 0),
        data: rfq,
      });
    }

    for (const offer of offers) {
      all.push({
        type: 'offer',
        timestamp: Number((offer as any).updatedAt ?? (offer as any).createdAt ?? 0),
        data: offer,
      });
    }

    for (const opt of options) {
      all.push({
        type: 'option',
        timestamp: Number(opt.expiry ?? 0),
        data: opt,
      });
    }

    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [rfqs, offers, options]);

  return (
    <div className="p-2">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-tertiary)]">state api (10s poll)</span>
          <span className="flex items-center gap-3 text-[10px]">
            {Object.entries(TYPE_COLORS).map(([name, color]) => (
              <span key={name} className="flex items-center gap-1">
                <span className="inline-block w-2 h-2" style={{ backgroundColor: color }} />
                <span className="text-[var(--color-text-tertiary)]">{name}</span>
              </span>
            ))}
          </span>
        </div>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {events.length} events{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
      </div>

      {isLoading ? (
        <div className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">loading...</div>
      ) : events.length === 0 ? (
        <div className="text-xs text-[var(--color-text-tertiary)] py-4 text-center">no data</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                <th className="px-2 py-1 text-left w-[60px]">type</th>
                <th className="px-2 py-1 text-left">time</th>
                <th className="px-2 py-1 text-left">id</th>
                <th className="px-2 py-1 text-left">details</th>
                <th className="px-2 py-1 text-left">tx</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt, i) => (
                <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
                  <td className="px-2 py-1">
                    <span style={{ color: TYPE_COLORS[evt.type] }}>{evt.type}</span>
                  </td>
                  <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                    {evt.timestamp > 0 ? new Date(evt.timestamp * 1000).toLocaleString() : '-'}
                  </td>
                  <td className="px-2 py-1">
                    {evt.type === 'option'
                      ? shortenAddress(evt.data.address)
                      : `#${evt.data.id ?? evt.data.quotationId ?? '-'}`}
                  </td>
                  <td className="px-2 py-1 text-[var(--color-text-secondary)]">
                    <EventDetails evt={evt} />
                  </td>
                  <td className="px-2 py-1">
                    {(evt.data.createdTx || evt.data.closedTx) ? (
                      <a
                        href={explorerTx(evt.data.closedTx ?? evt.data.createdTx)}
                        target="_blank"
                        rel="noopener"
                        className="text-[var(--color-text-link)]"
                      >
                        {shortenAddress(evt.data.closedTx ?? evt.data.createdTx)}
                      </a>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EventDetails({ evt }: { evt: UnifiedEvent }) {
  const d = evt.data;

  if (evt.type === 'rfq') {
    const stage = getRfqStage(d);
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <StageBadge stage={stage} />
        <span>{shortenAddress(d.requester)}</span>
        <span>{d.isRequestingLongPosition ? 'buy' : 'sell'}</span>
        <span>{d.optionType ?? ''}</span>
        <span>{Array.isArray(d.strikes) ? d.strikes.join(', ') : ''}</span>
        <span className="text-[var(--color-text-tertiary)]">×{d.numContracts ?? ''}</span>
        <span className="text-[var(--color-text-tertiary)]">impl:{d.implementation ?? '-'}</span>
        <span className="text-[var(--color-text-tertiary)]">col:{shortenAddress(d.collateral)}</span>
        {d.winner && <span>winner:{shortenAddress(d.winner)}</span>}
        {d.optionAddress && (
          <a href={explorerAddress(d.optionAddress)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
            opt:{shortenAddress(d.optionAddress)}
          </a>
        )}
      </span>
    );
  }

  if (evt.type === 'offer') {
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <span>rfq:#{d.quotationId}</span>
        <span>from:{shortenAddress(d.offeror)}</span>
        <span>{d.status ?? '-'}</span>
        {d.revealedAmount && <span>amt:{d.revealedAmount}</span>}
        {d.signingKey && <span className="text-[var(--color-text-tertiary)]">key:{d.signingKey.slice(0, 12)}...</span>}
      </span>
    );
  }

  if (evt.type === 'option') {
    return (
      <span className="flex items-center gap-2 flex-wrap">
        <span>rfq:#{d.quotationId}</span>
        <span>creator:{shortenAddress(d.creator)}</span>
        <span>type:{d.optionType ?? '-'}</span>
        <span>{Array.isArray(d.strikes) ? d.strikes.join(', ') : ''}</span>
        <span className="text-[var(--color-text-tertiary)]">
          exp:{d.expiry ? new Date(Number(d.expiry) * 1000).toLocaleDateString() : '-'}
        </span>
        <span className="text-[var(--color-text-tertiary)]">col:{shortenAddress(d.collateral)}</span>
      </span>
    );
  }

  return <span>-</span>;
}
