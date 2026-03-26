'use client';

import { useQuery } from '@tanstack/react-query';
import { useThetanutsClient } from './useThetanutsClient';
import { useWallet } from './useWallet';
import { getRfqStage, type RfqStage } from '@/lib/rfqUtils';

// Settlement data from the API
export interface FactorySettlement {
  settlementPrice: string | null;
  payoutBuyer: string | null;
  collateralReturnedSeller: string | null;
  exercised: boolean;
  deliveryAmount?: string | null;
}

// PnL entry from the API
export interface FactoryPnLEntry {
  side: 'buyer' | 'seller';
  entryRfqId: string;
  exitType: 'rfq' | 'settled-itm' | 'settled-otm' | 'active' | 'closed' | 'expired-awaiting-settlement';
  exitRfqId: string | null;
  cost: string | null;
  value: string | null;
  pnl: string | null;
  costUsd: string | null;
  valueUsd: string | null;
  pnlUsd: string | null;
  pnlPct: string | null;
}

export type OptionStatus = 'active' | 'closed' | 'expired-awaiting-settlement' | 'settled-itm' | 'settled-otm';

export interface FactoryPosition {
  quotationId: string;
  address: string | null;
  optionStatus: OptionStatus | null;
  isBuyer: boolean;
  underlyingAsset: string;
  implementationName: string;
  strikes: string[];
  expiryTimestamp: number;
  numContracts: string;
  collateral: string;
  collateralSymbol: string;
  collateralDecimals: number;
  collateralAmount: string;
  currentBestPrice: string;
  feeAmount: string;
  requester: string;
  winner: string;
  buyer: string;
  seller: string;
  settlement: FactorySettlement | null;
  pnl: FactoryPnLEntry[];
  rfqs: any[];
  assetPriceAtSettle: number | null;
  stage: RfqStage;
  implementation: string;
  collateralPriceFeed: string;
}

// Re-export as Position for backward compat
export type Position = FactoryPosition;

function deriveStage(opt: any): RfqStage {
  const os = opt.optionStatus as OptionStatus | undefined;
  if (os === 'active') return 'active';
  if (os === 'settled-itm' || os === 'settled-otm' || os === 'closed' || os === 'expired-awaiting-settlement') {
    return os;
  }
  // No optionStatus (unfulfilled RFQs that never created an option)
  if (opt.rfqs?.length) {
    return getRfqStage(opt.rfqs[0]);
  }
  return 'settled';
}

function deriveIsBuyer(opt: any, userAddress: string): boolean {
  const addr = userAddress.toLowerCase();
  if (opt.buyer && opt.buyer.toLowerCase() === addr) return true;
  if (opt.seller && opt.seller.toLowerCase() === addr) return false;
  if (opt.rfqs?.length) {
    const rfq = opt.rfqs[0];
    const isRequester = rfq.requester?.toLowerCase() === addr;
    return isRequester ? rfq.isRequestingLongPosition : !rfq.isRequestingLongPosition;
  }
  return opt.requester?.toLowerCase() === addr;
}

export function usePositions() {
  const { client } = useThetanutsClient();
  const { address } = useWallet();

  return useQuery<FactoryPosition[]>({
    queryKey: ['positions', address],
    queryFn: async () => {
      if (!address) return [];
      // SDK returns StateOption[] (narrow type) but API response is richer
      const options = await client.api.getUserOptionsFromRfq(address) as any[];
      return options.map((opt) => {
        const implementationName = opt.rfqs?.[0]?.implementationName ?? '';
        return {
          quotationId: opt.quotationId,
          address: opt.address ?? null,
          optionStatus: opt.optionStatus ?? null,
          isBuyer: deriveIsBuyer(opt, address),
          underlyingAsset: opt.underlyingAsset ?? '',
          implementationName,
          strikes: opt.strikes ?? [],
          expiryTimestamp: opt.expiryTimestamp ?? opt.expiry ?? 0,
          numContracts: opt.numContracts ?? '0',
          collateral: opt.collateral ?? opt.collateralToken ?? '',
          collateralSymbol: opt.collateralSymbol ?? '',
          collateralDecimals: opt.collateralDecimals ?? 6,
          collateralAmount: opt.collateralAmount ?? '0',
          currentBestPrice: opt.currentBestPrice ?? '0',
          feeAmount: opt.feeAmount ?? '0',
          requester: opt.requester ?? '',
          winner: opt.winner ?? '',
          buyer: opt.buyer ?? '',
          seller: opt.seller ?? '',
          settlement: opt.settlement ?? null,
          pnl: opt.pnl ?? [],
          rfqs: opt.rfqs ?? [],
          assetPriceAtSettle: opt.rfqs?.[0]?.assetPriceAtSettle ? Number(opt.rfqs[0].assetPriceAtSettle) / 1e8 : null,
          stage: deriveStage(opt),
          implementation: opt.implementation ?? opt.rfqs?.[0]?.implementation ?? '',
          collateralPriceFeed: opt.priceFeed ?? opt.collateralPriceFeed ?? opt.rfqs?.[0]?.collateralPriceFeed ?? '',
        };
      });
    },
    enabled: !!address,
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
}
