'use client';

import { useState } from 'react';
import { useUserRFQs } from '@/hooks/useUserRFQs';
import { useWallet } from '@/hooks/useWallet';
import StageBadge from '@/components/common/StageBadge';
import { getRfqStage } from '@/lib/rfqUtils';
import { shortenAddress, formatExpiryDate, explorerAddress } from '@/lib/utils';

const TABS = ['my rfqs', 'my offers', 'my options'] as const;
type Tab = typeof TABS[number];

export default function HistoryPage() {
  const { address } = useWallet();
  const { rfqs, offers, options, isLoading } = useUserRFQs();
  const [activeTab, setActiveTab] = useState<Tab>('my rfqs');

  if (!address) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="text-xs text-[var(--color-text-tertiary)] text-center">connect wallet to view history</div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-3">
      <div className="border border-[var(--color-border)]">
        {/* Tab bar */}
        <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs cursor-pointer border-none ${
                activeTab === tab
                  ? 'text-[var(--color-accent-green)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              [{tab}]
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-xs text-[var(--color-text-tertiary)] text-center">loading...</div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === 'my rfqs' && <RFQsTable rfqs={rfqs} />}
            {activeTab === 'my offers' && <OffersTable offers={offers} />}
            {activeTab === 'my options' && <OptionsTable options={options} />}
          </div>
        )}
      </div>
    </div>
  );
}

function RFQsTable({ rfqs }: { rfqs: any[] }) {
  if (rfqs.length === 0) return <div className="p-8 text-xs text-[var(--color-text-tertiary)] text-center">no rfqs</div>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
          <th className="px-2 py-1.5 text-left">id</th>
          <th className="px-2 py-1.5 text-left">stage</th>
          <th className="px-2 py-1.5 text-left">requester</th>
          <th className="px-2 py-1.5 text-left">side</th>
          <th className="px-2 py-1.5 text-left">collateral</th>
          <th className="px-2 py-1.5 text-left">implementation</th>
          <th className="px-2 py-1.5 text-left">strikes</th>
          <th className="px-2 py-1.5 text-left">contracts</th>
          <th className="px-2 py-1.5 text-left">expiry</th>
          <th className="px-2 py-1.5 text-left">offer end</th>
          <th className="px-2 py-1.5 text-left">limit?</th>
          <th className="px-2 py-1.5 text-left">winner</th>
          <th className="px-2 py-1.5 text-left">best price</th>
          <th className="px-2 py-1.5 text-left">option</th>
          <th className="px-2 py-1.5 text-left">fee</th>
        </tr>
      </thead>
      <tbody>
        {rfqs.map((rfq: any, i: number) => {
          const stage = getRfqStage(rfq);
          return (
            <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
              <td className="px-2 py-1.5">#{rfq.id ?? rfq.quotationId ?? i}</td>
              <td className="px-2 py-1.5"><StageBadge stage={stage} /></td>
              <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.requester)}</td>
              <td className="px-2 py-1.5">
                <span className={rfq.isRequestingLongPosition ? 'text-[var(--color-accent-green)]' : 'text-[var(--color-accent-red)]'}>
                  {rfq.isRequestingLongPosition ? 'buy' : 'sell'}
                </span>
              </td>
              <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.collateral)}</td>
              <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.implementation)}</td>
              <td className="px-2 py-1.5">{Array.isArray(rfq.strikes) ? rfq.strikes.join(', ') : '-'}</td>
              <td className="px-2 py-1.5">{rfq.numContracts ?? '-'}</td>
              <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">
                {rfq.expiryTimestamp ? formatExpiryDate(Number(rfq.expiryTimestamp)) : '-'}
              </td>
              <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">
                {rfq.offerEndTimestamp ? formatExpiryDate(Number(rfq.offerEndTimestamp)) : '-'}
              </td>
              <td className="px-2 py-1.5">{rfq.convertToLimitOrder ? 'yes' : 'no'}</td>
              <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(rfq.winner ?? rfq.currentWinner)}</td>
              <td className="px-2 py-1.5">{rfq.currentBestPriceOrReserve ?? '-'}</td>
              <td className="px-2 py-1.5">
                {(rfq.optionAddress || rfq.optionContract) ? (
                  <a href={explorerAddress(rfq.optionAddress ?? rfq.optionContract)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                    {shortenAddress(rfq.optionAddress ?? rfq.optionContract)}
                  </a>
                ) : '-'}
              </td>
              <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">{rfq.feeCollected ?? rfq.feeAmount ?? '-'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function OffersTable({ offers }: { offers: any[] }) {
  if (offers.length === 0) return <div className="p-8 text-xs text-[var(--color-text-tertiary)] text-center">no offers</div>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
          <th className="px-2 py-1.5 text-left">quotation id</th>
          <th className="px-2 py-1.5 text-left">offeror</th>
          <th className="px-2 py-1.5 text-left">status</th>
          <th className="px-2 py-1.5 text-left">signing key</th>
          <th className="px-2 py-1.5 text-left">encrypted offer</th>
          <th className="px-2 py-1.5 text-left">revealed amount</th>
          <th className="px-2 py-1.5 text-left">timestamp</th>
        </tr>
      </thead>
      <tbody>
        {offers.map((offer: any, i: number) => (
          <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
            <td className="px-2 py-1.5">#{offer.quotationId}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(offer.offeror)}</td>
            <td className="px-2 py-1.5">
              <span className={
                offer.status === 'accepted' ? 'text-[var(--color-accent-green)]' :
                offer.status === 'rejected' ? 'text-[var(--color-accent-red)]' :
                offer.status === 'revealed' ? 'text-[var(--color-accent-orange)]' :
                'text-[var(--color-text-secondary)]'
              }>
                {offer.status}
              </span>
            </td>
            <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">{offer.signingKey ? shortenAddress(offer.signingKey) : '-'}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">{offer.signedOfferForRequester ? shortenAddress(offer.signedOfferForRequester) : '-'}</td>
            <td className="px-2 py-1.5">{offer.revealedAmount ?? '-'}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">{offer.createdAt ? new Date(offer.createdAt).toLocaleString() : '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function OptionsTable({ options }: { options: any[] }) {
  if (options.length === 0) return <div className="p-8 text-xs text-[var(--color-text-tertiary)] text-center">no options</div>;

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-[var(--color-text-tertiary)] border-b border-[var(--color-border)]">
          <th className="px-2 py-1.5 text-left">option address</th>
          <th className="px-2 py-1.5 text-left">quotation id</th>
          <th className="px-2 py-1.5 text-left">implementation</th>
          <th className="px-2 py-1.5 text-left">buyer</th>
          <th className="px-2 py-1.5 text-left">seller</th>
          <th className="px-2 py-1.5 text-left">collateral</th>
          <th className="px-2 py-1.5 text-left">strikes</th>
          <th className="px-2 py-1.5 text-left">expiry</th>
        </tr>
      </thead>
      <tbody>
        {options.map((opt: any, i: number) => (
          <tr key={i} className="border-b border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-hover)]">
            <td className="px-2 py-1.5">
              <a href={explorerAddress(opt.address)} target="_blank" rel="noopener" className="text-[var(--color-text-link)]">
                {shortenAddress(opt.address)}
              </a>
            </td>
            <td className="px-2 py-1.5">#{opt.quotationId}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(opt.implementation ?? opt.optionType)}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(opt.buyer ?? opt.creator)}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(opt.seller)}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-secondary)]">{shortenAddress(opt.collateral)}</td>
            <td className="px-2 py-1.5">{Array.isArray(opt.strikes) ? opt.strikes.join(', ') : '-'}</td>
            <td className="px-2 py-1.5 text-[var(--color-text-tertiary)]">
              {opt.expiry ? formatExpiryDate(Number(opt.expiry)) : '-'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
