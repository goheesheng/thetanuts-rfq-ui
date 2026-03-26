'use client';

import { useState, useEffect } from 'react';
import PositionsPanel from '../positions/PositionsPanel';
import PollEventsTab from './PollEventsTab';
import ActiveTab from './ActiveTab';
import HistoryTab from './HistoryTab';
import AllRFQsTab from './AllRFQsTab';

interface BottomPanelProps {
  onClosePosition?: (position: any) => void;
  activeRfqId?: string | null;
}

const TABS = ['positions', 'active', 'all rfqs', 'poll', 'history'] as const;
type Tab = typeof TABS[number];

export default function BottomPanel({ onClosePosition, activeRfqId }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('positions');

  // Auto-switch to active tab when a new RFQ is created
  useEffect(() => {
    if (activeRfqId) {
      setActiveTab('active');
    }
  }, [activeRfqId]);

  return (
    <div className="border border-[var(--color-border)]">
      {/* Tab bar */}
      <div className="flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs cursor-pointer border-none whitespace-nowrap ${
              activeTab === tab
                ? 'text-[var(--color-accent-green)] border-b-2 border-b-[var(--color-accent-green)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            [{tab}]
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-h-[400px] overflow-y-auto">
        {activeTab === 'positions' && <PositionsPanel onClose={onClosePosition} />}
        {activeTab === 'active' && <ActiveTab expandRfqId={activeRfqId} />}
        {activeTab === 'all rfqs' && <AllRFQsTab />}
        {activeTab === 'poll' && <PollEventsTab />}
        {activeTab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}
