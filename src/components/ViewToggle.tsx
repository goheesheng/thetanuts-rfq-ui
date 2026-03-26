'use client';

interface ViewToggleProps {
  view: 'chain' | 'custom';
  onChange: (view: 'chain' | 'custom') => void;
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0 border border-[var(--color-border)]">
      <button
        onClick={() => onChange('chain')}
        className={`px-3 py-1 text-xs cursor-pointer border-none ${
          view === 'chain'
            ? 'bg-[var(--color-accent-green)] text-[var(--color-canvas)]'
            : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        [chain view]
      </button>
      <button
        onClick={() => onChange('custom')}
        className={`px-3 py-1 text-xs cursor-pointer border-none border-l border-[var(--color-border)] ${
          view === 'custom'
            ? 'bg-[var(--color-accent-green)] text-[var(--color-canvas)]'
            : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
        }`}
      >
        [custom rfq]
      </button>
    </div>
  );
}
