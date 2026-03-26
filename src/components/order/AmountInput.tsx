'use client';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  tokenSymbol: string;
  balance?: string;
  onMax?: () => void;
  label?: string;
  disabled?: boolean;
}

export default function AmountInput({ value, onChange, tokenSymbol, balance, onMax, label, disabled }: AmountInputProps) {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-0.5">
        <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">
          {label || 'amount'}
        </label>
        {balance && (
          <span className="text-[10px] text-[var(--color-text-tertiary)]">
            bal: {balance} {tokenSymbol}
            {onMax && (
              <button
                onClick={onMax}
                className="ml-1 text-[var(--color-accent-blue)] hover:underline cursor-pointer bg-transparent border-none text-[10px]"
              >
                [max]
              </button>
            )}
          </span>
        )}
      </div>
      <div className="flex items-center border border-[var(--color-border)]">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          className="flex-1 px-2 py-1.5 bg-[var(--color-input-bg)] text-xs text-[var(--color-text-primary)] outline-none border-none"
        />
        <span className="px-2 text-xs text-[var(--color-text-tertiary)] border-l border-[var(--color-border)]">
          {tokenSymbol}
        </span>
      </div>
    </div>
  );
}
