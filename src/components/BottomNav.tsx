'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSystemStatus, overallStatus, STATUS_DOT_CLASS, STATUS_LABEL, type ServiceStatus } from '../hooks/useSystemStatus';

const tabs = [
  { href: '/trade', label: 'trade' },
  { href: '/history', label: 'hist' },
  { href: '/mm', label: 'mm' },
];

function ServiceRow({ name, status, latency }: { name: string; status: ServiceStatus; latency: number | null }) {
  return (
    <div className="flex items-center justify-between text-[11px] font-mono">
      <div className="flex items-center gap-1.5">
        <span className={`inline-block w-1.5 h-1.5 ${STATUS_DOT_CLASS[status]}`} />
        <span className="text-[var(--color-text-secondary)]">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[var(--color-text-tertiary)]">{latency != null ? `${latency}ms` : '--'}</span>
        <span className={status === 'ok' ? 'text-[var(--color-accent-green)]' : status === 'down' ? 'text-[var(--color-accent-red)]' : 'text-[var(--color-accent-orange)]'}>
          {STATUS_LABEL[status]}
        </span>
      </div>
    </div>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const status = useSystemStatus();
  const overall = overallStatus(status);
  const [expanded, setExpanded] = useState(false);

  return (
    <nav className="block md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] z-[1000]">
      {expanded && (
        <div className="border-b border-[var(--color-border)] px-4 py-2.5 space-y-1.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] tracking-wider text-[var(--color-text-tertiary)]">-- status --</span>
            {status.rpc.blockNumber && (
              <span className="text-[10px] text-[var(--color-text-tertiary)]">#{status.rpc.blockNumber.toLocaleString()}</span>
            )}
          </div>
          <ServiceRow name="rpc" status={status.rpc.status} latency={status.rpc.latency} />
          <ServiceRow name="api" status={status.api.status} latency={status.api.latency} />
        </div>
      )}

      <div className="flex justify-around items-center py-1.5">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer bg-transparent border-none"
        >
          <span className={`inline-block w-2 h-2 ${STATUS_DOT_CLASS[overall]}`} />
          <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
            {expanded ? 'x' : 'sys'}
          </span>
        </button>

        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href} prefetch>
              <div className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] cursor-pointer">
                <span className={`text-xs font-mono ${
                  isActive
                    ? 'text-[var(--color-accent-green)]'
                    : 'text-[var(--color-text-tertiary)]'
                }`}>
                  {isActive ? `[${tab.label}]` : tab.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
