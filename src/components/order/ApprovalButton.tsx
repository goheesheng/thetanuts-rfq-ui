'use client';

import { useCollateralAllowance } from '@/hooks/useCollateralAllowance';

interface ApprovalButtonProps {
  tokenAddress: string | null;
  decimals: number;
  requiredAmount: bigint;
  tokenSymbol: string;
}

export default function ApprovalButton({ tokenAddress, decimals, requiredAmount, tokenSymbol }: ApprovalButtonProps) {
  const { allowance, isApproved, approving, approveMax, approveAmount } = useCollateralAllowance(tokenAddress, decimals);

  if (!tokenAddress) return null;

  const hasSufficientAllowance = allowance >= requiredAmount;
  if (hasSufficientAllowance) {
    return (
      <div className="text-xs text-[var(--color-accent-green)]">[approved]</div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => approveAmount(requiredAmount)}
        disabled={approving}
        className="flex-1 px-2 py-1.5 text-xs cursor-pointer border border-[var(--color-accent-green)] text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)] hover:text-[var(--color-canvas)] bg-transparent disabled:opacity-50"
      >
        {approving ? 'approving...' : `approve ${tokenSymbol}`}
      </button>
      <button
        onClick={approveMax}
        disabled={approving}
        className="px-2 py-1.5 text-xs cursor-pointer border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-transparent disabled:opacity-50"
      >
        max
      </button>
    </div>
  );
}
