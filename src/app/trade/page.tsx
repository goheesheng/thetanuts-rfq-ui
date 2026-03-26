'use client';

import { useState, useCallback } from 'react';
import ViewToggle from '@/components/ViewToggle';
import OptionChain from '@/components/chain/OptionChain';
import CustomRFQForm from '@/components/custom/CustomRFQForm';
import OrderPanel, { type OrderPanelSelection } from '@/components/order/OrderPanel';
import BottomPanel from '@/components/bottom/BottomPanel';
import { useChainlinkPrices } from '@/hooks/useChainlinkPrices';
import { useIsMobile } from '@/hooks/useIsMobile';
import WalletInfo from '@/components/WalletInfo';

export default function TradePage() {
  const [view, setView] = useState<'chain' | 'custom'>('chain');
  const [asset, setAsset] = useState<'ETH' | 'BTC'>('ETH');
  const [selection, setSelection] = useState<OrderPanelSelection | undefined>();
  const { data: spotPrices } = useChainlinkPrices();
  const isMobile = useIsMobile();
  const [activeRfqId, setActiveRfqId] = useState<string | null>(null);

  const handleSelectOption = useCallback((params: {
    strike: number;
    expiry: number;
    isCall: boolean;
    isBid: boolean;
    pricing: any;
  }) => {
    setSelection({
      strike: params.strike,
      expiry: params.expiry,
      isCall: params.isCall,
      // Clicking bid = sell (you match the bid), clicking ask = buy (you match the ask)
      isLong: !params.isBid,
      pricing: params.pricing,
    });
  }, []);

  const handleClosePosition = useCallback((position: any) => {
    const implName = position.implementationName?.toUpperCase() ?? '';
    const isCall = implName.includes('CALL');
    const strikeNum = Number(position.strikes[0]) / 1e8;

    // Derive asset from collateral symbol
    const collSym = (position.collateralSymbol ?? '').toUpperCase();
    if (collSym === 'CBBTC' || collSym === 'WBTC') {
      setAsset('BTC');
    } else if (collSym === 'WETH') {
      setAsset('ETH');
    }
    // USDC collateral → keep current asset (puts use USDC for any underlying)

    setSelection({
      strike: strikeNum,
      expiry: position.expiryTimestamp,
      isCall,
      isLong: !position.isBuyer, // flip direction
      existingOptionAddress: position.address,
      closeData: {
        numContracts: position.numContracts,
        strikes: position.strikes,
        collateral: position.collateral,
        collateralPriceFeed: position.collateralPriceFeed,
        implementation: position.implementation,
        collateralDecimals: position.collateralDecimals,
        collateralSymbol: position.collateralSymbol,
        isBuyer: position.isBuyer,
      },
    });
    setView('chain');
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelection(undefined);
  }, []);

  const handleRFQCreated = useCallback((quotationId: string) => {
    setActiveRfqId(quotationId);
  }, []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-3">
      <WalletInfo />

      {/* View toggle */}
      <div className="mb-3">
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === 'chain' ? (
        /* Chain View: Option chain + order panel side by side */
        <div className="flex flex-col md:flex-row gap-3">
          {/* Left: Option chain */}
          <div className="flex-1 min-w-0">
            <OptionChain
              asset={asset}
              onAssetChange={setAsset}
              onSelectOption={handleSelectOption}
              spotPrice={spotPrices?.[asset]}
            />
          </div>

          {/* Right: Order panel */}
          <div className="w-full md:w-[320px] shrink-0">
            <OrderPanel selection={selection} asset={asset} onRFQCreated={handleRFQCreated} onClearSelection={handleClearSelection} />
          </div>
        </div>
      ) : (
        /* Custom RFQ View: Full-width form */
        <div>
          <CustomRFQForm onRFQCreated={handleRFQCreated} />
        </div>
      )}

      {/* Bottom panel */}
      <div className="mt-3">
        <BottomPanel onClosePosition={handleClosePosition} activeRfqId={activeRfqId} />
      </div>
    </div>
  );
}
