'use client';

import { useState } from 'react';
import { useActiveRFQs, type EnrichedRfq } from '@/hooks/useActiveRFQs';
import { useMMOffer } from '@/hooks/useMMOffer';
import { useMMReveal } from '@/hooks/useMMReveal';
import { useMMSettle } from '@/hooks/useMMSettle';
import { useMMOfferHistory } from '@/hooks/useMMOfferHistory';
import { useMMPricing } from '@/hooks/useMMPricing';
import { useWallet } from '@/hooks/useWallet';
import StageBadge from '@/components/common/StageBadge';
import CountdownTimer from '@/components/common/CountdownTimer';
import { shortenAddress, formatPrice, formatExpiryDate } from '@/lib/utils';
import { formatOfferEndTime, type RfqStage } from '@/lib/rfqUtils';

const STAGE_FILTERS: { value: RfqStage | 'all'; label: string }[] = [
  { value: 'all', label: 'all' },
  { value: 'offer', label: 'offer' },
  { value: 'reveal', label: 'reveal' },
  { value: 'limit', label: 'limit' },
];

export default function MMPage() {
  const { address } = useWallet();
  const { rfqs: allRfqs, isLoading, lastUpdated } = useActiveRFQs();
  const [stageFilter, setStageFilter] = useState<RfqStage | 'all'>('all');
  const [selectedRfq, setSelectedRfq] = useState<EnrichedRfq | null>(null);

  const filteredRfqs = stageFilter === 'all' ? allRfqs : allRfqs.filter(r => r.stage === stageFilter);

  if (!address) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to access mm console</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-3 space-y-3">
      {/* Active RFQs Table */}
      <div className="border border-[var(--color-border)]">
        <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">active rfqs</span>
            {/* Stage filters */}
            <div className="flex gap-0">
              {STAGE_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStageFilter(f.value)}
                  className={`px-2 py-0.5 text-[10px] cursor-pointer border border-[var(--color-border)] ${
                    stageFilter === f.value
                      ? 'text-[var(--color-accent-blue)] bg-[var(--color-accent-blue)]/10'
                      : 'text-[var(--color-text-tertiary)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {lastUpdated && (
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>
        ) : filteredRfqs.length === 0 ? (
          <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">no active rfqs</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                  <th className="px-2 py-1.5 text-left">id</th>
                  <th className="px-2 py-1.5 text-left">requester</th>
                  <th className="px-2 py-1.5 text-left">side</th>
                  <th className="px-2 py-1.5 text-left">implementation</th>
                  <th className="px-2 py-1.5 text-left">strikes</th>
                  <th className="px-2 py-1.5 text-left">contracts</th>
                  <th className="px-2 py-1.5 text-left">expiry</th>
                  <th className="px-2 py-1.5 text-left">stage</th>
                  <th className="px-2 py-1.5 text-left">time left</th>
                  <th className="px-2 py-1.5 text-left">limit?</th>
                </tr>
              </thead>
              <tbody>
                {filteredRfqs.map((enriched, i) => {
                  const rfq = enriched.rfq;
                  const isSelected = selectedRfq?.rfq?.id === rfq.id;
                  return (
                    <tr
                      key={i}
                      onClick={() => setSelectedRfq(enriched)}
                      className={`border-b border-[var(--color-border-subtle)] cursor-pointer ${
                        isSelected ? 'bg-[var(--color-accent-blue)]/10' : 'hover:bg-[var(--color-surface-hover)]'
                      }`}
                    >
                      <td className="px-2 py-1.5">#{rfq.id ?? rfq.quotationId ?? i}</td>
                      <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.requester)}</td>
                      <td className="px-2 py-1.5">
                        <span className={rfq.isRequestingLongPosition ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                          {rfq.isRequestingLongPosition ? 'buy' : 'sell'}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.implementation)}</td>
                      <td className="px-2 py-1.5">{Array.isArray(rfq.strikes) ? rfq.strikes.join(', ') : '-'}</td>
                      <td className="px-2 py-1.5">{rfq.numContracts ?? '-'}</td>
                      <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">
                        {rfq.expiryTimestamp ? new Date(Number(rfq.expiryTimestamp) * 1000).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-2 py-1.5"><StageBadge stage={enriched.stage} /></td>
                      <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">
                        {rfq.offerEndTimestamp ? formatOfferEndTime(Number(rfq.offerEndTimestamp)) : '-'}
                      </td>
                      <td className="px-2 py-1.5">{rfq.convertToLimitOrder ? 'yes' : 'no'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail + Action Panel */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* RFQ Detail */}
        {selectedRfq && (
          <div className="flex-1 border border-[var(--color-border)]">
            <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">
                rfq #{selectedRfq.rfq.id ?? selectedRfq.rfq.quotationId} detail
              </span>
            </div>
            <div className="p-3 space-y-1 text-xs">
              <KV label="requester" value={shortenAddress(selectedRfq.rfq.requester)} />
              <KV label="stage" value={selectedRfq.stage} />
              <KV label="collateral" value={shortenAddress(selectedRfq.rfq.collateral)} />
              <KV label="implementation" value={shortenAddress(selectedRfq.rfq.implementation)} />
              <KV label="strikes" value={Array.isArray(selectedRfq.rfq.strikes) ? selectedRfq.rfq.strikes.join(', ') : '-'} />
              <KV label="numContracts" value={selectedRfq.rfq.numContracts ?? '-'} />
              <KV label="side" value={selectedRfq.rfq.isRequestingLongPosition ? 'buy (long)' : 'sell (short)'} />
              <KV label="convertToLimit" value={selectedRfq.rfq.convertToLimitOrder ? 'yes' : 'no'} />
              <KV label="offerEnd" value={selectedRfq.rfq.offerEndTimestamp ? formatExpiryDate(Number(selectedRfq.rfq.offerEndTimestamp)) : '-'} />
              <KV label="expiry" value={selectedRfq.rfq.expiryTimestamp ? formatExpiryDate(Number(selectedRfq.rfq.expiryTimestamp)) : '-'} />
              {selectedRfq.rfq.currentWinner && (
                <KV label="currentWinner" value={shortenAddress(selectedRfq.rfq.currentWinner)} />
              )}
              {selectedRfq.rfq.currentBestPriceOrReserve && (
                <KV label="bestPrice/reserve" value={selectedRfq.rfq.currentBestPriceOrReserve} />
              )}
            </div>
          </div>
        )}

        {/* Action Panel */}
        {selectedRfq && (
          <div className="w-full md:w-[300px] shrink-0">
            <MMActionPanel rfq={selectedRfq} />
          </div>
        )}
      </div>

      {/* My Offers Panel */}
      <MMOffersPanel />
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-tertiary)]">{label}</span>
      <span className="text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function MMActionPanel({ rfq: enriched }: { rfq: EnrichedRfq }) {
  const { makeOffer, isPending: offerPending } = useMMOffer();
  const { reveal, isPending: revealPending } = useMMReveal();
  const { settle, isPending: settlePending } = useMMSettle();
  const [offerAmount, setOfferAmount] = useState('');

  const rfq = enriched.rfq;
  const id = rfq.id ?? rfq.quotationId;

  return (
    <div className="border border-[var(--color-border)]">
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">action</span>
      </div>
      <div className="p-3 space-y-3">
        {enriched.stage === 'offer' && (
          <>
            <div className="text-xs text-[var(--color-accent-green)]">offer phase</div>
            <div>
              <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">offer amount</label>
              <input
                type="text"
                inputMode="decimal"
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value)}
                placeholder="price per contract"
                className="w-full px-2 py-1.5 border border-[var(--color-border)] bg-[var(--color-input-bg)] text-xs text-[var(--color-text-primary)] outline-none mt-0.5"
              />
            </div>
            <button
              onClick={() => {
                if (!offerAmount || !id) return;
                // Convert to bigint (assumes 6 decimals for USDC)
                const amountBn = BigInt(Math.round(parseFloat(offerAmount) * 1e6));
                makeOffer(id.toString(), amountBn, rfq.requesterPublicKey ?? '');
              }}
              disabled={offerPending || !offerAmount}
              className="w-full px-3 py-2 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {offerPending ? 'submitting...' : '> make offer'}
            </button>
          </>
        )}

        {enriched.stage === 'reveal' && (
          <>
            <div className="text-xs text-[var(--color-accent-orange)]">reveal phase</div>
            <button
              onClick={() => id && reveal(id.toString())}
              disabled={revealPending}
              className="w-full px-3 py-2 text-xs cursor-pointer border border-[var(--color-accent-orange)] text-[var(--color-accent-orange)] hover:bg-[var(--color-accent-orange)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {revealPending ? 'revealing...' : '> reveal offer'}
            </button>
          </>
        )}

        {enriched.stage === 'limit' && (
          <>
            <div className="text-xs text-[var(--color-accent-blue)]">limit order</div>
            <div className="text-xs text-[var(--color-text-secondary)]">
              settle at reserve price to become counterparty
            </div>
            <button
              onClick={() => id && settle(id.toString())}
              disabled={settlePending}
              className="w-full px-3 py-2 text-xs cursor-pointer border border-[var(--color-accent-blue)] text-[var(--color-accent-blue)] hover:bg-[var(--color-accent-blue)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
            >
              {settlePending ? 'settling...' : '> settle at reserve'}
            </button>
          </>
        )}

        {enriched.stage === 'post-reveal' && (
          <div className="text-xs text-[var(--color-text-tertiary)]">
            post-reveal — awaiting settlement
          </div>
        )}

        {(enriched.stage === 'settled' || enriched.stage === 'cancelled') && (
          <div className="text-xs text-[var(--color-text-tertiary)]">
            {enriched.stage}
          </div>
        )}
      </div>
    </div>
  );
}

function MMOffersPanel() {
  const { activeOffers, revealedOffers, wonOffers, history, isLoading } = useMMOfferHistory();
  const [tab, setTab] = useState<'active' | 'revealed' | 'won' | 'history'>('active');

  const tabs = [
    { value: 'active' as const, label: 'active', count: activeOffers.length },
    { value: 'revealed' as const, label: 'revealed', count: revealedOffers.length },
    { value: 'won' as const, label: 'won', count: wonOffers.length },
    { value: 'history' as const, label: 'history', count: history.length },
  ];

  const currentOffers = tab === 'active' ? activeOffers : tab === 'revealed' ? revealedOffers : tab === 'won' ? wonOffers : history;

  return (
    <div className="border border-[var(--color-border)]">
      <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="px-3 text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">my offers</span>
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-2 py-1.5 text-xs cursor-pointer border-none ${
              tab === t.value ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-text-tertiary)]'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="max-h-[300px] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>
        ) : currentOffers.length === 0 ? (
          <div className="p-4 text-xs text-[var(--color-text-tertiary)] text-center">no {tab} offers</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
                <th className="px-2 py-1 text-left">rfq id</th>
                <th className="px-2 py-1 text-left">status</th>
                <th className="px-2 py-1 text-left">revealed</th>
                <th className="px-2 py-1 text-left">timestamp</th>
              </tr>
            </thead>
            <tbody>
              {currentOffers.map((offer: any, i: number) => (
                <tr key={i} className="border-b border-[var(--color-border-subtle)]">
                  <td className="px-2 py-1">#{offer.quotationId}</td>
                  <td className="px-2 py-1">
                    <span className={
                      offer.status === 'accepted' ? 'text-[var(--color-accent-green)]' :
                      offer.status === 'revealed' ? 'text-[var(--color-accent-orange)]' :
                      'text-[var(--color-text-secondary)]'
                    }>
                      {offer.status}
                    </span>
                  </td>
                  <td className="px-2 py-1">{offer.revealedAmount ?? '-'}</td>
                  <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                    {offer.createdAt ? new Date(offer.createdAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
