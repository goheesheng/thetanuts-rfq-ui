// ---------------------------------------------------------------------------
// Kyber Swap API Service
// ---------------------------------------------------------------------------

export interface KyberQuote {
  inputAmount: string;
  outputAmount: string;
  totalGas: string;
  gasUsd: string;
  encodedSwapData: string;
}

const KYBER_BASE_URL = process.env.KYBER_SWAP_URL || 'https://web.thetanuts.finance/kyber/';

/**
 * Fetch a swap quote from Kyber aggregator.
 */
export async function fetchKyberQuote(params: {
  chainId: number;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  to: string;
  slippageTolerance?: number;
}): Promise<KyberQuote> {
  const searchParams = new URLSearchParams({
    chainId: params.chainId.toString(),
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    to: params.to,
    slippageTolerance: (params.slippageTolerance ?? 10).toString(),
    saveGas: '0',
    gasInclude: '1',
    gasPrice: '1000000000',
  });

  const res = await fetch(`${KYBER_BASE_URL}?${searchParams}`);
  if (!res.ok) {
    throw new Error(`Kyber API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    inputAmount: data.inputAmount,
    outputAmount: data.outputAmount,
    totalGas: data.totalGas,
    gasUsd: data.gasUsd,
    encodedSwapData: data.encodedSwapData,
  };
}
