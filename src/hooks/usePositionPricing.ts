'use client';

import { useMemo } from 'react';
import type { Position } from './usePositions';
import type { MMVanillaPricing } from '@thetanuts-finance/thetanuts-client';

export interface PnLResult {
  pnlUSD: string;
  pnlPercent: string;
  entryValueUSD: string;
  currentValueUSD: string;
  currentValueTooltip: string | null;
  premiumUSD: string;
}

export interface PositionWithPricing {
  position: Position;
  pnlResult: PnLResult | null;
}

/** Scale raw on-chain value to human-readable number */
function scale(raw: string, decimals: number): number {
  return Number(raw) / 10 ** decimals;
}

/** Convert collateral-denominated value to USD */
function toUSD(value: number, isBase: boolean, spot: number): number {
  return isBase ? value * spot : value;
}

/** Format USD: 2dp for values >= $0.01, full decimals for tiny values */
function fmtUSD(val: number): string {
  const abs = Math.abs(val);
  if (abs === 0) return '0.00';
  if (abs < 0.01) return val.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
  return val.toFixed(2);
}

const BASE_COLLATERALS = new Set(['WETH', 'cbBTC']);

function isBaseCollateral(symbol: string): boolean {
  return BASE_COLLATERALS.has(symbol);
}

export function usePositionPricing(
  positions: Position[],
  ethPricing: Record<string, MMVanillaPricing> | undefined,
  btcPricing: Record<string, MMVanillaPricing> | undefined
): PositionWithPricing[] {
  return useMemo(() => {
    if (!positions.length) return [];

    const allPricing = { ...ethPricing, ...btcPricing };

    return positions.map((position) => {
      const d = position.collateralDecimals;
      const isBase = isBaseCollateral(position.collateralSymbol);

      // Non-active positions: use API PnL (match the user's side)
      const userSide = position.isBuyer ? 'buyer' : 'seller';
      const apiPnlEntry = position.pnl?.find(p => p.exitType !== 'active' && p.side === userSide);
      if (apiPnlEntry) {
        const pnlUsd = apiPnlEntry.pnlUsd != null ? Number(apiPnlEntry.pnlUsd) / 1e8 : null;
        const pnlPct = apiPnlEntry.pnlPct != null ? Number(apiPnlEntry.pnlPct) : null;
        const entryUsd = apiPnlEntry.costUsd != null ? Number(apiPnlEntry.costUsd) / 1e8 : null;
        const currentUsd = apiPnlEntry.valueUsd != null ? Number(apiPnlEntry.valueUsd) / 1e8 : null;

        if (pnlUsd !== null && pnlPct !== null) {
          return {
            position,
            pnlResult: {
              pnlUSD: pnlUsd.toFixed(2),
              pnlPercent: pnlPct.toFixed(2),
              entryValueUSD: entryUsd !== null ? entryUsd.toFixed(2) : '-',
              currentValueUSD: currentUsd !== null ? currentUsd.toFixed(2) : '-',
              currentValueTooltip: null,
              premiumUSD: '-',
            },
          };
        }
        return { position, pnlResult: null };
      }

      // Active positions: use MM pricing
      const pStrike = Number(position.strikes[0]) / 1e8;
      const pExpiry = position.expiryTimestamp;

      // Derive isCall from implementation name
      const implName = position.implementationName?.toUpperCase() ?? '';
      const positionIsCall = implName.includes('CALL');

      let matchedPricing: MMVanillaPricing | null = null;
      for (const pricing of Object.values(allPricing)) {
        if (pricing.strike === pStrike && pricing.expiry === pExpiry && pricing.isCall === positionIsCall) {
          matchedPricing = pricing;
          break;
        }
      }

      // Premium is always computable from on-chain data — doesn't need MM pricing
      const premium = scale(position.currentBestPrice, d);
      const contracts = scale(position.numContracts, d);

      // Helper: build a premium-only result (no mark-to-market)
      const premiumOnlyResult = (spotForUSD: number): PositionWithPricing => {
        const premiumUSD = toUSD(premium, isBase, spotForUSD);
        return {
          position,
          pnlResult: {
            pnlUSD: '-',
            pnlPercent: '-',
            entryValueUSD: '-',
            currentValueUSD: '-',
            currentValueTooltip: null,
            premiumUSD: premium > 0 ? fmtUSD(premiumUSD) : '-',
          },
        };
      };

      if (!matchedPricing) {
        return premiumOnlyResult(0);
      }

      const COLLATERAL_TO_ASSET: Record<string, string> = {
        USDC: 'USD',
        WETH: 'ETH',
        cbBTC: 'BTC',
      };

      const spot = matchedPricing.underlyingPrice;
      const assetKey = COLLATERAL_TO_ASSET[position.collateralSymbol] ?? 'USD';
      const collateral = matchedPricing.byCollateral[assetKey];
      if (!collateral) {
        return premiumOnlyResult(spot);
      }

      // Buyer marks to bid (their exit price), seller marks to ask (their close cost).
      // If the relevant price is 0 the MM has no market — show premium but skip mark-to-market.
      if (position.isBuyer && collateral.mmBidPriceBuffered <= 0) {
        return premiumOnlyResult(spot);
      }
      if (!position.isBuyer && collateral.mmAskPriceBuffered <= 0) {
        return premiumOnlyResult(spot);
      }

      if (contracts === 0) {
        return premiumOnlyResult(spot);
      }

      // MM prices are in underlying terms — convert to collateral terms
      const mmBid = isBase
        ? collateral.mmBidPriceBuffered
        : collateral.mmBidPriceBuffered * spot;
      const mmAsk = isBase
        ? collateral.mmAskPriceBuffered
        : collateral.mmAskPriceBuffered * spot;

      let entryVal: number;
      let currentVal: number;
      let premiumUSD: number;
      let currentValueTooltip: string | null = null;

      const collateralAmt = scale(position.collateralAmount, d);
      const fee = scale(position.feeAmount, d);
      const entrySpot = position.assetPriceAtSettle ?? spot;

      if (position.isBuyer) {
        entryVal = premium;
        premiumUSD = toUSD(premium, isBase, entrySpot);
        currentVal = mmBid * contracts;
      } else {
        const closeCost = mmAsk * contracts;
        entryVal = collateralAmt;
        premiumUSD = toUSD(premium, isBase, entrySpot);
        currentVal = collateralAmt - closeCost;
      }

      const entryUSD = toUSD(entryVal, isBase, entrySpot);
      let currentUSD: number;
      let pnlUSD: number;

      if (position.isBuyer) {
        currentUSD = toUSD(currentVal, isBase, spot);
        currentValueTooltip = `Sell Price × Contracts\n= Current Value: $${fmtUSD(currentUSD)}`;
        pnlUSD = currentUSD - entryUSD;
      } else {
        const feeUSD = toUSD(fee, isBase, entrySpot);
        const closeCostUSD = toUSD(mmAsk * contracts, isBase, spot);
        currentUSD = toUSD(currentVal, isBase, spot);
        pnlUSD = (currentUSD + premiumUSD - feeUSD) - entryUSD;
        currentValueTooltip = `Collateral: $${fmtUSD(entryUSD)}\n+ Premium: $${fmtUSD(premiumUSD)}\n− Fee: $${fmtUSD(feeUSD)}\n− Close Cost: $${fmtUSD(closeCostUSD)}\n= PnL: $${fmtUSD(pnlUSD)}`;
      }
      const pnlPercent = entryUSD !== 0 ? (pnlUSD / Math.abs(entryUSD)) * 100 : 0;

      return {
        position,
        pnlResult: {
          pnlUSD: fmtUSD(pnlUSD),
          pnlPercent: pnlPercent.toFixed(2),
          entryValueUSD: fmtUSD(entryUSD),
          currentValueUSD: fmtUSD(currentUSD),
          currentValueTooltip,
          premiumUSD: fmtUSD(premiumUSD),
        },
      };
    });
  }, [positions, ethPricing, btcPricing]);
}
