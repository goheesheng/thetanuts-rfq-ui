'use client';

interface BuySellToggleProps {
  isLong: boolean;
  onChange: (isLong: boolean) => void;
  disabled?: boolean;
}

export default function BuySellToggle({ isLong, onChange, disabled }: BuySellToggleProps) {
  return (
    <div className={`flex gap-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={() => onChange(true)}
        className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] ${
          isLong
            ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border-[var(--color-accent-green)]'
            : 'bg-transparent text-[var(--color-text-secondary)]'
        }`}
      >
        buy
      </button>
      <button
        onClick={() => onChange(false)}
        className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] border-l-0 ${
          !isLong
            ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] border-[var(--color-accent-red)]'
            : 'bg-transparent text-[var(--color-text-secondary)]'
        }`}
      >
        sell
      </button>
    </div>
  );
}
