'use client';

import { useMemo } from 'react';
import { validateButterfly, validateCondor, validateIronCondor } from '@/lib/rfqUtils';
import type { StructureType } from '@/lib/rfqUtils';

interface StrikeInputProps {
  structure: StructureType;
  strikes: string[];
  onChange: (strikes: string[]) => void;
  disabled?: boolean;
}

const STRIKE_LABELS: Record<StructureType, string[]> = {
  vanilla: ['strike'],
  spread: ['lower strike', 'upper strike'],
  butterfly: ['lower', 'middle', 'upper'],
  condor: ['strike 1', 'strike 2', 'strike 3', 'strike 4'],
  iron_condor: ['put lower', 'put upper', 'call lower', 'call upper'],
};

export default function StrikeInput({ structure, strikes, onChange, disabled }: StrikeInputProps) {
  const labels = STRIKE_LABELS[structure];
  const numInputs = labels.length;

  // Ensure strikes array has correct length
  const values = Array.from({ length: numInputs }, (_, i) => strikes[i] ?? '');

  const handleChange = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next.slice(0, numInputs));
  };

  // Validate strikes for multi-leg structures
  const validationError = useMemo(() => {
    const nums = values.map(v => parseFloat(v) || 0).filter(n => n > 0);
    if (nums.length < numInputs) return null; // not all filled in yet

    if (structure === 'butterfly') {
      const result = validateButterfly(nums);
      return result.valid ? null : result.error;
    }
    if (structure === 'condor') {
      const result = validateCondor(nums);
      return result.valid ? null : result.error;
    }
    if (structure === 'iron_condor') {
      const result = validateIronCondor(nums);
      return result.valid ? null : result.error;
    }
    return null;
  }, [values, numInputs, structure]);

  return (
    <div className={`space-y-1.5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {labels.map((label, i) => (
        <div key={label}>
          <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">{label}</label>
          <input
            type="text"
            inputMode="decimal"
            value={values[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            placeholder="0.00"
            className="w-full px-2 py-1.5 border border-[var(--color-border)] bg-[var(--color-input-bg)] text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-blue)]"
          />
        </div>
      ))}
      {validationError && (
        <div className="text-[10px] text-[var(--color-accent-red)]">{validationError}</div>
      )}
    </div>
  );
}
