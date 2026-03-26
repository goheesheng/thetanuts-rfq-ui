'use client';

import { useState, useEffect, useCallback } from 'react';
import BuySellToggle from './BuySellToggle';
import CallPutToggle from './CallPutToggle';
import CollateralSelector from './CollateralSelector';
import StructureSelector from './StructureSelector';
import StrikeInput from './StrikeInput';
import AmountInput from './AmountInput';
import ExpiryPicker from './ExpiryPicker';
import SettlementToggle from './SettlementToggle';
import SwapToggle from './SwapToggle';
import ApprovalButton from './ApprovalButton';
import OrderSummary from './OrderSummary';
import PayoutChart from './PayoutChart';
import { useWallet } from '@/hooks/useWallet';
import { useChainlinkPrices } from '@/hooks/useChainlinkPrices';
import { useRFQCreate } from '@/hooks/useRFQCreate';
import { useCloseRFQ } from '@/hooks/useCloseRFQ';
import { useCollateralBalance } from '@/hooks/useCollateralBalance';
import { useMMPricing } from '@/hooks/useMMPricing';
import { CALL_COLLATERAL, PUT_COLLATERAL, DELIVERY_TOKENS } from '@/lib/constants';
import { sdkCalculateNumContracts, calculateDeliveryAmount, getImplementationType, getPhysicalProduct } from '@/lib/rfqUtils';
import { parseUnits, formatUnits, formatTokenAmount } from '@/lib/utils';
import type { StructureType, SettlementType, ProductName } from '@/lib/rfqUtils';

export interface CloseData {
  numContracts: string;       // raw on-chain BigInt string (exact)
  strikes: string[];          // raw on-chain BigInt strings (exact)
  collateral: string;         // collateral token address
  collateralPriceFeed: string;
  implementation: string;     // implementation contract address
  collateralDecimals: number;
  collateralSymbol: string;
  isBuyer: boolean;           // original position side
}

export interface OrderPanelSelection {
  strike?: number;
  expiry?: number;
  isCall?: boolean;
  isLong?: boolean;
  pricing?: any;
  existingOptionAddress?: string;
  closeData?: CloseData;
}

interface OrderPanelProps {
  selection?: OrderPanelSelection;
  asset: 'ETH' | 'BTC';
  onRFQCreated?: (quotationId: string) => void;
  onClearSelection?: () => void;
}

export default function OrderPanel({ selection, asset, onRFQCreated, onClearSelection }: OrderPanelProps) {
  const { address, isConnected } = useWallet();
  const { submit, isPending } = useRFQCreate();
  const { submit: submitClose, isPending: isClosePending } = useCloseRFQ();

  // Close mode detection
  const isCloseMode = !!selection?.existingOptionAddress;
  const closeData = selection?.closeData;

  // Form state
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

  // Collateral info — iron condor always uses USDC
  const collateralInfo = structure === 'iron_condor'
    ? PUT_COLLATERAL
    : optionType === 'PUT'
      ? PUT_COLLATERAL
      : (CALL_COLLATERAL[asset] ?? PUT_COLLATERAL);
  const { balance, formattedBalance } = useCollateralBalance(collateralInfo.address, collateralInfo.decimals);

  // Pricing for reserve price calculation
  const { data: pricing } = useMMPricing(asset);
  const { data: spotPrices } = useChainlinkPrices();
  const spotPrice = spotPrices?.[asset] ?? 0;

  // Apply selection from chain click or close
  useEffect(() => {
    if (!selection) return;
    if (selection.strike !== undefined) setStrikes([selection.strike.toString()]);
    if (selection.expiry !== undefined) {
      setExpiry(selection.expiry);
      const d = new Date(selection.expiry * 1000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      setCustomExpiry(`${yyyy}-${mm}-${dd}`);
    }
    if (selection.isCall !== undefined) setOptionType(selection.isCall ? 'CALL' : 'PUT');
    if (selection.isLong !== undefined) setIsLong(selection.isLong);
    setStructure('vanilla');
    // Prefill amount in close mode
    if (selection.closeData) {
      const contracts = Number(selection.closeData.numContracts) / 10 ** selection.closeData.collateralDecimals;
      setAmount(contracts.toString());
    }
  }, [selection]);

  // Calculate numContracts and reserve price
  const amountNum = parseFloat(amount) || 0;
  const strikeNums = strikes.map(s => parseFloat(s) || 0).filter(s => s > 0);

  // Determine product name
  const isIronCondor = structure === 'iron_condor';
  const isPhysical = settlementType === 'physical' && structure === 'vanilla';
  const product: ProductName = isIronCondor
    ? 'IRON_CONDOR'
    : isPhysical
      ? getPhysicalProduct(optionType)
      : getImplementationType(optionType, strikeNums.length);

  // Delivery token for physical options
  const deliveryToken = isPhysical ? DELIVERY_TOKENS[asset]?.[optionType] : undefined;

  let reservePrice = 0;
  let mmPrice = 0;

  // Try to get pricing-based reserve
  if (pricing && strikeNums.length > 0 && expiry) {
    for (const [, p] of Object.entries(pricing)) {
      if (p.strike === strikeNums[0] && p.expiry === expiry) {
        const coll = Object.values(p.byCollateral)[0];
        if (coll) {
          mmPrice = isLong ? coll.mmAskPriceBuffered : coll.mmBidPriceBuffered;
          reservePrice = mmPrice;
        }
        break;
      }
    }
  }

  const numContracts = isCloseMode && closeData
    ? Number(closeData.numContracts) / 10 ** closeData.collateralDecimals
    : sdkCalculateNumContracts({
        tradeAmount: amountNum,
        product,
        strikes: strikeNums,
        isBuy: isLong,
        mmPrice,
        spot: spotPrice,
      });

  // Delivery amount for physical options
  const deliveryResult = isPhysical && numContracts > 0
    ? calculateDeliveryAmount(numContracts, product, strikeNums, asset as 'ETH' | 'BTC')
    : null;

  // Two-step confirm flow
  const handleSubmit = useCallback(() => {
    // Start countdown
    setConfirmCountdown(15);
  }, []);

  useEffect(() => {
    if (confirmCountdown === null) return;
    if (confirmCountdown <= 0) {
      setConfirmCountdown(null);
      return;
    }
    const id = setTimeout(() => setConfirmCountdown(confirmCountdown - 1), 1000);
    return () => clearTimeout(id);
  }, [confirmCountdown]);

  const clearClose = useCallback(() => {
    setStrikes(['']);
    setExpiry(null);
    setCustomExpiry('');
    setAmount('');
    setConfirmCountdown(null);
    onClearSelection?.();
  }, [onClearSelection]);

  const handleConfirm = useCallback(async () => {
    if (strikeNums.length === 0 || !expiry) return;

    let result;

    if (isCloseMode && closeData && selection?.existingOptionAddress) {
      result = await submitClose({
        existingOptionAddress: selection.existingOptionAddress,
        numContracts: closeData.numContracts,
        collateral: closeData.collateral,
        collateralPriceFeed: closeData.collateralPriceFeed,
        implementation: closeData.implementation,
        collateralDecimals: closeData.collateralDecimals,
        strikes: closeData.strikes,
        expiry,
        isLong,
        reservePrice,
        fillOrKill: false,
      });
    } else {
      result = await submit({
        underlying: asset,
        optionType,
        strikes: strikeNums,
        expiry,
        numContracts,
        isLong,
        collateralToken: collateralInfo.symbol,
        reservePrice,
        existingOptionAddress: selection?.existingOptionAddress,
        isIronCondor,
        isPhysical,
        deliveryToken: deliveryToken?.address,
      });
    }

    setConfirmCountdown(null);

    if (result?.quotationId) {
      onRFQCreated?.(result.quotationId);
      if (isCloseMode) {
        clearClose();
      }
    }
  }, [asset, optionType, strikeNums, expiry, numContracts, isLong, collateralInfo, reservePrice, selection, submit, submitClose, onRFQCreated, isIronCondor, isPhysical, deliveryToken, isCloseMode, closeData, clearClose]);

  return (
    <div className="border border-[var(--color-border)]">
      <div className="px-3 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        {isCloseMode ? (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--color-accent-blue)] uppercase tracking-wider">
              close position — {closeData?.isBuyer ? 'sell to close' : 'buy to close'}
            </span>
            <button onClick={clearClose} className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] cursor-pointer bg-transparent border-none">
              ✕ cancel
            </button>
          </div>
        ) : (
          <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider">order panel</span>
        )}
      </div>

      <div className="p-3 space-y-3">
        <BuySellToggle isLong={isLong} onChange={setIsLong} disabled={isCloseMode} />
        <CallPutToggle optionType={optionType} onChange={setOptionType} disabled={isCloseMode} />
        <CollateralSelector optionType={optionType} underlying={asset} selected={collateralInfo.address} onChange={() => {}} />
        <StructureSelector selected={structure} onChange={setStructure} disabled={isCloseMode} />
        {structure === 'vanilla' && !isCloseMode && (
          <SettlementToggle value={settlementType} onChange={setSettlementType} disabled={isCloseMode} />
        )}
        <StrikeInput structure={structure} strikes={strikes} onChange={setStrikes} disabled={isCloseMode} />
        <ExpiryPicker value={expiry} onChange={setExpiry} customInput={customExpiry} onCustomChange={setCustomExpiry} disabled={isCloseMode} />

        <AmountInput
          value={amount}
          onChange={setAmount}
          tokenSymbol={collateralInfo.symbol}
          balance={formattedBalance}
          onMax={() => setAmount(formattedBalance)}
          disabled={isCloseMode}
          label={isCloseMode ? 'contracts (full position)' : undefined}
        />

        {numContracts > 0 && (
          <div className="text-xs text-[var(--color-text-secondary)]">
            contracts: <span className="text-[var(--color-text-primary)]">{formatTokenAmount(numContracts)}</span>
          </div>
        )}

        {!isCloseMode && <SwapToggle enabled={swapEnabled} onChange={setSwapEnabled} />}

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
          numContracts={numContracts}
          reservePrice={reservePrice}
          collateralSymbol={collateralInfo.symbol}
          structure={structure}
          confirmCountdown={confirmCountdown}
          onSubmit={handleSubmit}
          onConfirm={handleConfirm}
          isPending={isPending || isClosePending}
          isWalletConnected={isConnected}
          settlementType={structure === 'vanilla' ? settlementType : undefined}
          deliveryInfo={deliveryResult ? { amount: deliveryResult.deliveryAmount, token: deliveryResult.deliveryToken } : undefined}
        />

        {!isCloseMode && strikeNums.length > 0 && spotPrice > 0 && (
          <PayoutChart
            optionType={optionType}
            structure={structure}
            strikes={strikeNums}
            premiumPerContract={reservePrice}
            amount={amountNum}
            spotPrice={spotPrice}
            isLong={isLong}
          />
        )}
      </div>
    </div>
  );
}
