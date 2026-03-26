'use client';

import { useState } from 'react';
import BuySellToggle from '../order/BuySellToggle';
import CallPutToggle from '../order/CallPutToggle';
import StructureSelector from '../order/StructureSelector';
import SettlementToggle from '../order/SettlementToggle';
import StrikeInput from '../order/StrikeInput';
import AmountInput from '../order/AmountInput';
import ExpiryPicker from '../order/ExpiryPicker';
import SwapToggle from '../order/SwapToggle';
import ApprovalButton from '../order/ApprovalButton';
import OrderSummary from '../order/OrderSummary';
import { useWallet } from '@/hooks/useWallet';
import { useRFQCreate } from '@/hooks/useRFQCreate';
import { useCollateralBalance } from '@/hooks/useCollateralBalance';
import { CALL_COLLATERAL, PUT_COLLATERAL, SUPPORTED_UNDERLYINGS, DELIVERY_TOKENS } from '@/lib/constants';
import { parseUnits } from '@/lib/utils';
import type { StructureType, SettlementType } from '@/lib/rfqUtils';
import { useCallback, useEffect } from 'react';

interface CustomRFQFormProps {
  onRFQCreated?: (quotationId: string) => void;
}

export default function CustomRFQForm({ onRFQCreated }: CustomRFQFormProps) {
  const { isConnected } = useWallet();
  const { submit, isPending } = useRFQCreate();

  const [underlying, setUnderlying] = useState<string>('ETH');
  const [isLong, setIsLong] = useState(true);
  const [optionType, setOptionType] = useState<'CALL' | 'PUT'>('CALL');
  const [structure, setStructure] = useState<StructureType>('vanilla');
  const [strikes, setStrikes] = useState<string[]>(['']);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [customExpiry, setCustomExpiry] = useState('');
  const [amount, setAmount] = useState('');
  const [settlementType, setSettlementType] = useState<SettlementType>('cash');
  const [swapEnabled, setSwapEnabled] = useState(false);
  const [confirmCountdown, setConfirmCountdown] = useState<number | null>(null);

  // Reset settlement to cash when structure changes away from vanilla
  useEffect(() => {
    if (structure !== 'vanilla') setSettlementType('cash');
  }, [structure]);

  const isIronCondor = structure === 'iron_condor';
  const isPhysical = settlementType === 'physical' && structure === 'vanilla';
  const deliveryToken = isPhysical ? DELIVERY_TOKENS[underlying]?.[optionType] : undefined;

  // Iron condor always uses USDC
  const collateralInfo = isIronCondor
    ? PUT_COLLATERAL
    : optionType === 'PUT'
      ? PUT_COLLATERAL
      : (CALL_COLLATERAL[underlying] ?? PUT_COLLATERAL);
  const { formattedBalance } = useCollateralBalance(collateralInfo.address, collateralInfo.decimals);

  const strikeNums = strikes.map(s => parseFloat(s) || 0).filter(s => s > 0);
  const amountNum = parseFloat(amount) || 0;

  const handleSubmit = useCallback(() => {
    setConfirmCountdown(15);
  }, []);

  useEffect(() => {
    if (confirmCountdown === null) return;
    if (confirmCountdown <= 0) { setConfirmCountdown(null); return; }
    const id = setTimeout(() => setConfirmCountdown(confirmCountdown - 1), 1000);
    return () => clearTimeout(id);
  }, [confirmCountdown]);

  const handleConfirm = useCallback(async () => {
    if (strikeNums.length === 0 || !expiry) return;
    const result = await submit({
      underlying,
      optionType,
      strikes: strikeNums,
      expiry,
      numContracts: amountNum,
      isLong,
      collateralToken: collateralInfo.symbol,
      reservePrice: 0, // Manual mode — no MM pricing, user accepts any price
      isIronCondor,
      isPhysical,
      deliveryToken: deliveryToken?.address,
    });
    setConfirmCountdown(null);

    if (result?.quotationId) {
      onRFQCreated?.(result.quotationId);
    }
  }, [underlying, optionType, strikeNums, expiry, amountNum, isLong, collateralInfo, submit, onRFQCreated, isIronCondor, isPhysical, deliveryToken]);

  return (
    <div className="border border-[var(--color-border)]">
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">custom rfq builder</span>
      </div>

      <div className="p-3 space-y-3 max-w-lg">
        {/* Underlying selector */}
        <div>
          <label className="text-[var(--color-text-tertiary)] text-[10px] uppercase tracking-wider">underlying</label>
          <div className="flex flex-wrap gap-0 mt-0.5">
            {SUPPORTED_UNDERLYINGS.map((u) => (
              <button
                key={u}
                onClick={() => setUnderlying(u)}
                className={`px-2 py-1 text-xs cursor-pointer border border-[var(--color-border)] ${
                  underlying === u
                    ? 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)] border-[var(--color-accent-green)]'
                    : 'bg-transparent text-[var(--color-text-secondary)]'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <BuySellToggle isLong={isLong} onChange={setIsLong} />
        <CallPutToggle optionType={optionType} onChange={setOptionType} />
        <StructureSelector selected={structure} onChange={setStructure} />
        {structure === 'vanilla' && (
          <SettlementToggle value={settlementType} onChange={setSettlementType} />
        )}
        <StrikeInput structure={structure} strikes={strikes} onChange={setStrikes} />
        <ExpiryPicker value={expiry} onChange={setExpiry} customInput={customExpiry} onCustomChange={setCustomExpiry} />

        <AmountInput
          value={amount}
          onChange={setAmount}
          tokenSymbol={collateralInfo.symbol}
          balance={formattedBalance}
          onMax={() => setAmount(formattedBalance)}
        />

        <SwapToggle enabled={swapEnabled} onChange={setSwapEnabled} />

        <ApprovalButton
          tokenAddress={collateralInfo.address}
          decimals={collateralInfo.decimals}
          requiredAmount={amount ? parseUnits(amount, collateralInfo.decimals) : 0n}
          tokenSymbol={collateralInfo.symbol}
        />

        <OrderSummary
          optionType={optionType}
          isLong={isLong}
          strikes={strikeNums}
          expiry={expiry}
          numContracts={amountNum}
          reservePrice={0}
          collateralSymbol={collateralInfo.symbol}
          structure={structure}
          confirmCountdown={confirmCountdown}
          onSubmit={handleSubmit}
          onConfirm={handleConfirm}
          isPending={isPending}
          isWalletConnected={isConnected}
        />
      </div>
    </div>
  );
}
