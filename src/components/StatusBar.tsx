'use client';

import { useSystemStatus, overallStatus, STATUS_DOT_CLASS, STATUS_LABEL, type ServiceStatus } from '../hooks/useSystemStatus';

function Dot({ status }: { status: ServiceStatus }) {
  return <span className={`inline-block w-1.5 h-1.5 shrink-0 ${STATUS_DOT_CLASS[status]}`} />;
}

function Latency({ ms }: { ms: number | null }) {
  return <span className="text-[var(--color-text-tertiary)]">{ms != null ? `${ms}ms` : '--'}</span>;
}

export default function StatusBar() {
  const status = useSystemStatus();
  const overall = overallStatus(status);

  return (
    <div className="hidden md:flex fixed bottom-0 left-0 right-0 h-6 items-center justify-between px-4 z-[1000] text-[11px] text-[var(--color-text-secondary)] bg-[var(--color-surface)] border-t border-[var(--color-border)]">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <Dot status={overall} />
          <span>{overall === 'ok' ? 'operational' : STATUS_LABEL[overall]}</span>
        </span>
        <span className="text-[var(--color-border-emphasis)]">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-tertiary)]">rpc</span>
          <Dot status={status.rpc.status} />
          <Latency ms={status.rpc.latency} />
          {status.rpc.blockNumber && (
            <span className="text-[var(--color-text-primary)]">#{status.rpc.blockNumber.toLocaleString()}</span>
          )}
        </span>
        <span className="text-[var(--color-border-emphasis)]">|</span>
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--color-text-tertiary)]">api</span>
          <Dot status={status.api.status} />
          <Latency ms={status.api.latency} />
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-[var(--color-accent-green)] tracking-wider text-[10px]">RFQ</span>
        <span className="text-[var(--color-border-emphasis)]">|</span>
        <a href="https://docs.thetanuts.finance" target="_blank" rel="noopener"
           className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]">
          powered by thetanuts
        </a>
      </div>
    </div>
  );
}
