'use client';

import { formatShortDate } from '@/lib/utils';

interface ExpirySelectorProps {
  expiries: number[];
  selected: number | null;
  onChange: (expiry: number) => void;
}

export default function ExpirySelector({ expiries, selected, onChange }: ExpirySelectorProps) {
  if (expiries.length === 0) {
    return <div className="text-xs text-[var(--color-text-tertiary)]">no expiries</div>;
  }

  return (
    <div className="flex items-center gap-0 overflow-x-auto flex-nowrap">
      {expiries.map((expiry) => (
        <button
          key={expiry}
          onClick={() => onChange(expiry)}
          className={`px-2 py-1 text-xs cursor-pointer border border-[var(--color-border)] whitespace-nowrap shrink-0 ${
            selected === expiry
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]'
              : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {formatShortDate(expiry)}
        </button>
      ))}
    </div>
  );
}
