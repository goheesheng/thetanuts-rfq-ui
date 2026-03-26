'use client';

import type { SettlementType } from '@/lib/rfqUtils';

interface SettlementToggleProps {
  value: SettlementType;
  onChange: (value: SettlementType) => void;
  disabled?: boolean;
}

export default function SettlementToggle({ value, onChange, disabled }: SettlementToggleProps) {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">settlement</label>
      <div className="flex gap-0 mt-0.5">
        <button
          onClick={() => onChange('cash')}
          className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] ${
            value === 'cash'
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]'
              : 'bg-transparent text-[var(--color-text-secondary)]'
          }`}
        >
          cash
        </button>
        <button
          onClick={() => onChange('physical')}
          className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] border-l-0 ${
            value === 'physical'
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]'
              : 'bg-transparent text-[var(--color-text-secondary)]'
          }`}
        >
          physical
        </button>
      </div>
    </div>
  );
}
