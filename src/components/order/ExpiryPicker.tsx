'use client';

interface ExpiryPickerProps {
  value: number | null;
  onChange: (expiry: number) => void;
  customInput?: string;
  onCustomChange?: (value: string) => void;
  disabled?: boolean;
}

const QUICK_OFFSETS = [
  { label: '1D', days: 1 },
  { label: '2D', days: 2 },
  { label: '3D', days: 3 },
  { label: '7D', days: 7 },
  { label: '14D', days: 14 },
];

function getExpiryTimestamp(days: number): number {
  // Round up to next 08:00 UTC
  const now = new Date();
  const target = new Date(now);
  target.setUTCDate(target.getUTCDate() + days);
  target.setUTCHours(8, 0, 0, 0);
  return Math.floor(target.getTime() / 1000);
}

function tsToDateStr(ts: number): string {
  const d = new Date(ts * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatExpiryDisplay(ts: number | null): string {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) + ' 08:00 UTC';
}

export default function ExpiryPicker({ value, onChange, customInput, onCustomChange, disabled }: ExpiryPickerProps) {
  return (
    <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
      <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">expiry</label>
      <div className="flex gap-0 mt-0.5">
        {QUICK_OFFSETS.map((offset) => {
          const ts = getExpiryTimestamp(offset.days);
          const isSelected = value === ts;
          return (
            <button
              key={offset.label}
              onClick={() => {
                onChange(ts);
                onCustomChange?.(tsToDateStr(ts));
              }}
              className={`px-2 py-1 text-xs cursor-pointer border border-[var(--color-border)] ${
                isSelected
                  ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]'
                  : 'bg-transparent text-[var(--color-text-secondary)]'
              }`}
            >
              {offset.label}
            </button>
          );
        })}
      </div>
      {onCustomChange && (
        <input
          type="date"
          value={customInput ?? ''}
          onChange={(e) => {
            onCustomChange(e.target.value);
            if (e.target.value) {
              const d = new Date(e.target.value);
              d.setUTCHours(8, 0, 0, 0);
              onChange(Math.floor(d.getTime() / 1000));
            }
          }}
          className="w-full mt-1.5 px-2 py-1.5 border border-[var(--color-border)] bg-[var(--color-input-bg)] text-xs text-[var(--color-text-primary)] outline-none"
        />
      )}
      {value && (
        <div className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">
          {formatExpiryDisplay(value)}
        </div>
      )}
    </div>
  );
}
