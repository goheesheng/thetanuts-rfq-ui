'use client';

import { useSyncExternalStore } from 'react';
import { subscribe, getSnapshot, closeToast, type ToastItem, type ToastStatus } from '../lib/toast';

const STATUS_PREFIX: Record<ToastStatus, { symbol: string; cssVar: string }> = {
  success: { symbol: '✓', cssVar: 'var(--color-accent-green)' },
  error: { symbol: '✗', cssVar: 'var(--color-accent-red)' },
  warning: { symbol: '⚠', cssVar: 'var(--color-accent-orange)' },
  loading: { symbol: '◌', cssVar: 'var(--color-accent-blue)' },
};

function ProgressBar({ createdAt, duration }: { createdAt: number; duration: number }) {
  return (
    <div className="h-px mt-1.5 opacity-40 overflow-hidden">
      <div
        className="h-full bg-[var(--color-accent-green)]"
        style={{
          width: '100%',
          animation: `shrink ${duration}ms linear forwards`,
          animationDelay: `${-(Date.now() - createdAt)}ms`,
        }}
      />
    </div>
  );
}

function ToastCard({ item }: { item: ToastItem }) {
  const { symbol, cssVar } = STATUS_PREFIX[item.status];
  const duration = item.duration === undefined ? 5000 : item.duration;
  const isLoading = item.status === 'loading';

  return (
    <div
      className="text-xs leading-relaxed px-3 py-2 border-l-2 animate-[slideIn_0.15s_ease-out]"
      style={{ borderColor: cssVar }}
    >
      <div className="flex items-start gap-2">
        <span
          className={isLoading ? 'animate-spin' : ''}
          style={{ color: cssVar }}
        >
          {symbol}
        </span>
        <div className="flex-1 min-w-0">
          <span style={{ color: cssVar }}>{item.title}</span>
          {item.description && (
            <div className="text-[var(--color-text-tertiary)] mt-0.5">{item.description}</div>
          )}
        </div>
        <button
          onClick={() => closeToast(item.id)}
          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] cursor-pointer bg-transparent border-none text-xs leading-none"
        >
          ×
        </button>
      </div>
      {duration !== null && <ProgressBar createdAt={item.createdAt} duration={duration} />}
    </div>
  );
}

export default function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-12 right-4 z-[9999] w-[340px] max-w-[calc(100vw-2rem)]">
      <div className="border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)]">
        <div className="flex items-center justify-between px-3 py-1 border-b border-[var(--color-border)]">
          <span className="text-[10px] text-[var(--color-text-tertiary)]">-- notifications --</span>
          <span className="text-[10px] text-[var(--color-text-tertiary)]">{toasts.length}</span>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {toasts.map((item) => (
            <ToastCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
