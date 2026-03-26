'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import { formatPrice, formatTokenAmount } from '@/lib/utils';
import { calculatePayout } from '@/lib/pnlUtils';
import type { StructureType } from '@/lib/rfqUtils';

interface PayoutChartProps {
  optionType: 'CALL' | 'PUT';
  structure: StructureType;
  strikes: number[];
  premiumPerContract: number; // reserve price per contract
  amount: number;             // user-entered collateral amount (0 = not yet entered)
  spotPrice: number;
  isLong: boolean;
}

const W = 400;
const H = 140;
const PAD_Y = 0.15;

/** Map structure + optionType to the pnlUtils type key */
function getPnlType(optionType: 'CALL' | 'PUT', structure: StructureType): string {
  switch (structure) {
    case 'spread': return optionType === 'CALL' ? 'CALL_SPREAD' : 'PUT_SPREAD';
    case 'butterfly': return 'CALL_FLY';
    case 'condor': return optionType === 'CALL' ? 'CALL_CONDOR' : 'PUT_CONDOR';
    case 'iron_condor': return 'IRON_CONDOR';
    default: return optionType === 'CALL' ? 'INVERSE_CALL' : 'PUT';
  }
}

export default function PayoutChart({ optionType, structure, strikes, premiumPerContract, amount, spotPrice, isLong }: PayoutChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const isCall = optionType === 'CALL';
  const sorted = useMemo(() => [...strikes].sort((a, b) => a - b), [strikes]);
  const pnlType = getPnlType(optionType, structure);

  // Default to 1 contract if user hasn't entered amount (same as optionsbook-ui)
  const contracts = amount > 0 && premiumPerContract > 0 ? amount / premiumPerContract : 1;
  const premium = amount > 0 ? amount : premiumPerContract; // total premium
  const label = amount > 0 ? `${contracts.toFixed(2)} contracts` : 'per contract';

  const calcPayout = useCallback((price: number): number => {
    const gross = calculatePayout(pnlType, sorted, price, contracts);
    if (!isFinite(gross)) return 0;
    // For buyer: pnl = payout - premium. For seller: pnl = premium - payout.
    return isLong ? gross - premium : premium - gross;
  }, [pnlType, sorted, contracts, premium, isLong]);

  // Chart data
  const chartPoints = useMemo(() => {
    const allPoints = [...sorted, spotPrice];
    const minP = Math.min(...allPoints);
    const maxP = Math.max(...allPoints);
    const spread = maxP - minP || maxP * 0.1;
    const padding = Math.max(spread * 3, maxP * 0.15);
    const center = (minP + maxP) / 2;
    const chartMin = center - padding;
    const chartMax = center + padding;
    const points: { x: number; y: number }[] = [];
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      const price = chartMin + ((chartMax - chartMin) * i) / steps;
      points.push({ x: price, y: calcPayout(price) });
    }
    return points;
  }, [sorted, spotPrice, calcPayout]);

  const rawMaxY = Math.max(...chartPoints.map(p => p.y), 0);
  const rawMinY = Math.min(...chartPoints.map(p => p.y), 0);
  const rawRange = rawMaxY - rawMinY || 1;
  const padAmount = rawRange * PAD_Y;
  const minY = rawMinY - padAmount;
  const maxY = rawMaxY + padAmount;
  const yRange = maxY - minY;

  const toSvgX = (i: number) => (i / (chartPoints.length - 1)) * W;
  const toSvgY = (val: number) => H - ((val - minY) / yRange) * H;
  const zeroY = toSvgY(0);

  const chartMin = chartPoints[0]?.x ?? 0;
  const chartMax = chartPoints[chartPoints.length - 1]?.x ?? 1;
  const xRange = chartMax - chartMin;
  const spotX = ((spotPrice - chartMin) / xRange) * W;

  // Green/red segments split at zero
  const { greenSegments, redSegments } = useMemo(() => {
    const greens: string[][] = [];
    const reds: string[][] = [];
    let curGreen: string[] = [];
    let curRed: string[] = [];

    for (let i = 0; i < chartPoints.length; i++) {
      const p = chartPoints[i];
      const px = toSvgX(i);
      const py = toSvgY(p.y);

      if (p.y >= 0) {
        if (i > 0 && chartPoints[i - 1].y < 0) {
          const prev = chartPoints[i - 1];
          const t = (0 - prev.y) / (p.y - prev.y);
          const crossX = toSvgX(i - 1) + t * (px - toSvgX(i - 1));
          curRed.push(`${crossX},${zeroY}`);
          if (curRed.length > 1) reds.push(curRed);
          curRed = [];
          curGreen = [`${crossX},${zeroY}`];
        }
        curGreen.push(`${px},${py}`);
      } else {
        if (i > 0 && chartPoints[i - 1].y >= 0) {
          const prev = chartPoints[i - 1];
          const t = (0 - prev.y) / (p.y - prev.y);
          const crossX = toSvgX(i - 1) + t * (px - toSvgX(i - 1));
          curGreen.push(`${crossX},${zeroY}`);
          if (curGreen.length > 1) greens.push(curGreen);
          curGreen = [];
          curRed = [`${crossX},${zeroY}`];
        }
        curRed.push(`${px},${py}`);
      }
    }
    if (curGreen.length > 1) greens.push(curGreen);
    if (curRed.length > 1) reds.push(curRed);

    return {
      greenSegments: greens.map(s => s.join(' ')),
      redSegments: reds.map(s => s.join(' ')),
    };
  }, [chartPoints, minY, yRange]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const idx = Math.round(x * (chartPoints.length - 1));
    setHoverIdx(Math.max(0, Math.min(chartPoints.length - 1, idx)));
  }, [chartPoints.length]);

  const hoverPoint = hoverIdx !== null ? chartPoints[hoverIdx] : null;

  // Scenarios
  const scenarios = useMemo(() => {
    if (structure === 'spread' && sorted.length >= 2) {
      const lo = sorted[0];
      const hi = sorted[1];
      const spreadWidth = hi - lo;
      const maxPayout = spreadWidth * contracts;
      const maxProfit = isLong ? maxPayout - premium : premium;
      const profitPercent = premium > 0 ? (maxProfit / premium) * 100 : 0;
      const breakevenPrice = isCall ? lo + premium / contracts : hi - premium / contracts;

      return [
        { label: isCall ? `Below ${formatPrice(lo)}` : `Above ${formatPrice(hi)}`, price: isCall ? lo - spreadWidth * 0.5 : hi + spreadWidth * 0.5, pnl: isLong ? -premium : premium - maxPayout, pnlPercent: -100 },
        { label: 'Breakeven', price: breakevenPrice, pnl: 0, pnlPercent: 0 },
        { label: isCall ? `Above ${formatPrice(hi)}` : `Below ${formatPrice(lo)}`, price: isCall ? hi + spreadWidth * 0.5 : lo - spreadWidth * 0.5, pnl: maxProfit, pnlPercent: profitPercent },
        { label: 'Current', price: spotPrice, pnl: calcPayout(spotPrice), pnlPercent: premium > 0 ? (calcPayout(spotPrice) / premium) * 100 : 0 },
      ].sort((a, b) => a.price - b.price);
    }

    // Vanilla: percentage offsets from spot
    const offsets = [-0.15, -0.05, 0, 0.05, 0.15];
    return offsets.map(offset => {
      const price = spotPrice * (1 + offset);
      const pnl = calcPayout(price);
      const pnlPercent = premium > 0 ? (pnl / premium) * 100 : 0;
      const lbl = offset === 0 ? 'Current' : `${offset > 0 ? '+' : ''}${(offset * 100).toFixed(0)}%`;
      return { label: lbl, price, pnl, pnlPercent };
    });
  }, [sorted, spotPrice, premium, contracts, isCall, isLong, structure, calcPayout]);

  // Summary stats
  const strike = sorted[0] ?? 0;
  const strike2 = sorted[1] ?? strike;
  const isSpread = structure === 'spread';
  const spreadWidth = isSpread && sorted.length >= 2 ? sorted[1] - sorted[0] : 0;
  const breakeven = isSpread ? null : (isCall ? strike + premiumPerContract : strike - premiumPerContract);
  const spreadBreakeven = isSpread ? (isCall ? strike + premiumPerContract : strike2 - premiumPerContract) : null;
  const leverage = spotPrice > 0 && premiumPerContract > 0 ? spotPrice / premiumPerContract : 0;

  return (
    <div className="border border-[var(--color-border)]">
      <div className="border-b border-[var(--color-border)] px-3 py-1.5">
        <span className="section-label">-- payout ({label}) --</span>
      </div>
      <div className="p-3">
        {/* Chart */}
        <div className="h-[140px] relative mb-3 border border-[var(--color-border)] overflow-hidden bg-[var(--color-chart-bg)]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            className="w-full h-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* Zero line */}
            <line x1="0" x2={W} y1={zeroY} y2={zeroY}
              stroke="var(--color-border-emphasis)" strokeWidth="0.5" strokeDasharray="4 2" />

            {/* Spot price line */}
            {spotX >= 0 && spotX <= W && (
              <>
                <line x1={spotX} x2={spotX} y1="0" y2={H}
                  stroke="var(--color-accent-blue)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <text x={spotX + 3} y="10" fill="var(--color-accent-blue)" fontSize="8"
                  style={{ paintOrder: 'stroke', stroke: 'var(--color-chart-bg)', strokeWidth: 3 }}>
                  spot
                </text>
              </>
            )}

            {/* Green profit segments */}
            {greenSegments.map((pts, i) => (
              <polyline key={`g${i}`} fill="none" stroke="var(--color-accent-green)" strokeWidth="1.5" points={pts} />
            ))}
            {/* Red loss segments */}
            {redSegments.map((pts, i) => (
              <polyline key={`r${i}`} fill="none" stroke="var(--color-accent-red)" strokeWidth="1.5" points={pts} />
            ))}

            {/* Fill regions */}
            <defs>
              <clipPath id="rfqAboveZero">
                <rect x="0" y="0" width={W} height={zeroY} />
              </clipPath>
              <clipPath id="rfqBelowZero">
                <rect x="0" y={zeroY} width={W} height={H - zeroY} />
              </clipPath>
            </defs>
            <polygon
              clipPath="url(#rfqAboveZero)"
              fill="var(--color-accent-green)" opacity="0.08"
              points={`${chartPoints.map((p, i) => `${toSvgX(i)},${toSvgY(p.y)}`).join(' ')} ${toSvgX(chartPoints.length - 1)},${zeroY} 0,${zeroY}`}
            />
            <polygon
              clipPath="url(#rfqBelowZero)"
              fill="var(--color-accent-red)" opacity="0.08"
              points={`${chartPoints.map((p, i) => `${toSvgX(i)},${toSvgY(p.y)}`).join(' ')} ${toSvgX(chartPoints.length - 1)},${zeroY} 0,${zeroY}`}
            />

            {/* Hover crosshair */}
            {hoverPoint && hoverIdx !== null && (
              <>
                <line x1={toSvgX(hoverIdx)} x2={toSvgX(hoverIdx)} y1="0" y2={H}
                  stroke="var(--color-text-secondary)" strokeWidth="0.5" opacity="0.6" />
                <circle
                  cx={toSvgX(hoverIdx)} cy={toSvgY(hoverPoint.y)} r="3"
                  fill={hoverPoint.y >= 0 ? 'var(--color-accent-green)' : 'var(--color-accent-red)'}
                  stroke="var(--color-chart-bg)" strokeWidth="1"
                />
              </>
            )}
          </svg>

          {/* Hover tooltip */}
          {hoverPoint && hoverIdx !== null && (
            <div
              className="absolute top-1 pointer-events-none text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] px-1.5 py-0.5"
              style={{
                left: `${Math.min(Math.max((hoverIdx / (chartPoints.length - 1)) * 100, 5), 75)}%`,
              }}
            >
              <span className="text-[var(--color-text-secondary)]">{formatPrice(hoverPoint.x)}</span>
              {' '}
              <span className={hoverPoint.y >= 0 ? 'pnl-positive' : 'pnl-negative'}>
                {hoverPoint.y >= 0 ? '+' : ''}{formatTokenAmount(hoverPoint.y)}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)] mb-3">
          <span>{formatPrice(chartMin)}</span>
          <span>spot: {formatPrice(spotPrice)}</span>
          <span>{formatPrice(chartMax)}</span>
        </div>

        <hr className="border-[var(--color-border)] mb-3" />

        {/* Summary stats */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">Max Loss</span>
            <span className="pnl-negative">-${formatTokenAmount(premium)}</span>
          </div>
          {breakeven !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Breakeven</span>
              <span>{formatPrice(breakeven)}</span>
            </div>
          )}
          {spreadBreakeven !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Breakeven</span>
              <span>{formatPrice(spreadBreakeven)}</span>
            </div>
          )}
          {isSpread && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Max Return</span>
              <span className="pnl-positive">${formatTokenAmount(spreadWidth - premiumPerContract)}</span>
            </div>
          )}
          {leverage > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Leverage</span>
              <span className="text-[var(--color-accent-blue)]">{leverage.toFixed(1)}x</span>
            </div>
          )}
        </div>

        <hr className="border-[var(--color-border)] my-3" />

        {/* Scenarios */}
        <span className="text-xs text-[var(--color-text-secondary)] mb-2 block">Settlement Scenarios ({label})</span>
        {scenarios.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs py-0.5">
            <span className="text-[var(--color-text-tertiary)]">{s.label} {formatPrice(s.price)}</span>
            <span className={`font-semibold ${s.pnl >= 0 ? 'pnl-positive' : 'pnl-negative'}`}>
              {s.pnl >= 0 ? '+' : ''}${formatTokenAmount(s.pnl)} ({s.pnlPercent.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
