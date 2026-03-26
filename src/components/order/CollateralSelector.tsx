'use client';

import { CALL_COLLATERAL, PUT_COLLATERAL } from '@/lib/constants';

interface CollateralSelectorProps {
  optionType: 'CALL' | 'PUT';
  underlying: string;
  selected: string;
  onChange: (address: string) => void;
}

export default function CollateralSelector({ optionType, underlying, selected, onChange }: CollateralSelectorProps) {
  if (optionType === 'PUT') {
    return (
      <div className="text-xs">
        <span className="text-[var(--color-text-tertiary)]">collateral: </span>
        <span className="text-[var(--color-text-primary)]">{PUT_COLLATERAL.symbol}</span>
      </div>
    );
  }

  // Calls: show underlying collateral options
  const collateral = CALL_COLLATERAL[underlying];
  if (!collateral) {
    return <div className="text-xs text-[var(--color-text-tertiary)]">no collateral available</div>;
  }

  return (
    <div className="text-xs">
      <span className="text-[var(--color-text-tertiary)]">collateral: </span>
      <span className="text-[var(--color-text-primary)]">{collateral.symbol}</span>
    </div>
  );
}
