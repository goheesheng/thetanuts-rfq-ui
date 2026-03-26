'use client';

interface AssetSelectorProps {
  selected: 'ETH' | 'BTC';
  onChange: (asset: 'ETH' | 'BTC') => void;
}

export default function AssetSelector({ selected, onChange }: AssetSelectorProps) {
  return (
    <div className="flex items-center gap-0">
      {(['ETH', 'BTC'] as const).map((asset) => (
        <button
          key={asset}
          onClick={() => onChange(asset)}
          className={`px-3 py-1 text-xs cursor-pointer border border-[var(--color-border)] ${
            selected === asset
              ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border-[var(--color-accent-green)]'
              : 'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {asset}
        </button>
      ))}
    </div>
  );
}
