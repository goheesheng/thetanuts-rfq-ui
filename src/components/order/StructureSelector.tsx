'use client';

import type { StructureType } from '@/lib/rfqUtils';

interface StructureSelectorProps {
  selected: StructureType;
  onChange: (structure: StructureType) => void;
  disabled?: boolean;
}

const structures: { value: StructureType; label: string }[] = [
  { value: 'vanilla', label: 'vanilla' },
  { value: 'spread', label: 'spread' },
  { value: 'butterfly', label: 'butterfly' },
  { value: 'condor', label: 'condor' },
  { value: 'iron_condor', label: 'iron condor' },
];

export default function StructureSelector({ selected, onChange, disabled }: StructureSelectorProps) {
  return (
    <div className={`flex gap-0 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {structures.map((s) => (
        <button
          key={s.value}
          onClick={() => onChange(s.value)}
          className={`px-2 py-1 text-xs cursor-pointer border border-[var(--color-border)] ${
            selected === s.value
              ? 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)] border-[var(--color-accent-blue)]'
              : 'bg-transparent text-[var(--color-text-secondary)]'
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
