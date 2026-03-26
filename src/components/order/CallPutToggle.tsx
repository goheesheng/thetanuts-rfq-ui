'use client';

interface CallPutToggleProps {
  optionType: 'CALL' | 'PUT';
  onChange: (type: 'CALL' | 'PUT') => void;
  disabled?: boolean;
}

export default function CallPutToggle({ optionType, onChange, disabled }: CallPutToggleProps) {
  return (
    <div className={`flex gap-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <button
        onClick={() => onChange('CALL')}
        className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] ${
          optionType === 'CALL'
            ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border-[var(--color-accent-green)]'
            : 'bg-transparent text-[var(--color-text-secondary)]'
        }`}
      >
        call
      </button>
      <button
        onClick={() => onChange('PUT')}
        className={`flex-1 px-3 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] border-l-0 ${
          optionType === 'PUT'
            ? 'bg-[var(--color-accent-red)]/20 text-[var(--color-accent-red)] border-[var(--color-accent-red)]'
            : 'bg-transparent text-[var(--color-text-secondary)]'
        }`}
      >
        put
      </button>
    </div>
  );
}
