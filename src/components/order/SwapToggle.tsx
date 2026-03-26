'use client';

interface SwapToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  fromToken?: string;
  toToken?: string;
}

export default function SwapToggle({ enabled, onChange, fromToken, toToken }: SwapToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-tertiary)] text-xs">swap via kyber</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`px-2 py-0.5 text-xs cursor-pointer border border-[var(--color-border)] ${
          enabled
            ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
            : 'bg-transparent text-[var(--color-text-tertiary)]'
        }`}
      >
        {enabled ? '[on]' : '[off]'}
      </button>
    </div>
  );
}
