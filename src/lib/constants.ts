import {
  CHAIN_CONFIGS_BY_ID,
  buildPriceFeedSymbolMap,
  getOptionImplementationInfo,
  type OptionImplementationInfo,
  type ChainConfig,
} from '@thetanuts-finance/thetanuts-client';
import { DEFAULT_CHAIN_ID } from './chains';

// ---------------------------------------------------------------------------
// App-level constants (chain-independent)
// ---------------------------------------------------------------------------

export const REFERRER_ADDRESS = process.env.REFERRER_ADDRESS || '';
export const PRICE_DECIMALS = 8;
export const PRICE_DIVISOR = 10 ** PRICE_DECIMALS;

// Supported underlying assets
export const SUPPORTED_UNDERLYINGS = ['ETH', 'BTC', 'SOL', 'DOGE', 'XRP', 'BNB', 'PAXG', 'AVAX'] as const;
export type SupportedUnderlying = typeof SUPPORTED_UNDERLYINGS[number];

// ---------------------------------------------------------------------------
// Chain-derived constants (dynamic per chain)
// ---------------------------------------------------------------------------

export interface ChainConstants {
  chainId: number;
  config: ChainConfig;
  usdcAddress: string;
  usdcDecimals: number;
  chainlinkUnderlyingSymbols: Record<string, string>;
  optionImplementations: Record<string, OptionImplementationInfo>;
  collateralTokens: Record<string, { name: string; type: string; decimals: number; asset: string }>;
  explorerUrl: string;
  optionFactoryAddress: string;
  priceFeeds: Record<string, string>;
}

const chainConstantsCache = new Map<number, ChainConstants>();

function inferAssetMeta(symbol: string): { type: string; asset: string } {
  if (/USD/i.test(symbol)) return { type: 'QUOTE', asset: 'USD' };
  const stripped = symbol
    .replace(/^aBas/i, '')
    .replace(/^cb/i, '')
    .replace(/^W/i, '');
  return { type: 'BASE', asset: stripped || symbol };
}

export function buildChainConstants(chainId: number): ChainConstants {
  const cached = chainConstantsCache.get(chainId);
  if (cached) return cached;

  const config = CHAIN_CONFIGS_BY_ID[chainId as keyof typeof CHAIN_CONFIGS_BY_ID];
  if (!config) {
    throw new Error(`Unsupported chainId: ${chainId}`);
  }

  const collateralTokens: Record<string, { name: string; type: string; decimals: number; asset: string }> = {};
  for (const [symbol, token] of Object.entries(config.tokens)) {
    const meta = inferAssetMeta(symbol);
    collateralTokens[token.address.toLowerCase()] = {
      name: token.symbol,
      type: meta.type,
      decimals: token.decimals,
      asset: meta.asset,
    };
  }

  const usdc = config.tokens['USDC'];

  const constants: ChainConstants = {
    chainId,
    config,
    usdcAddress: usdc?.address ?? '',
    usdcDecimals: usdc?.decimals ?? 6,
    chainlinkUnderlyingSymbols: buildPriceFeedSymbolMap(chainId as any),
    optionImplementations: config.optionImplementations,
    collateralTokens,
    explorerUrl: config.explorerUrl,
    optionFactoryAddress: config.contracts.optionFactory,
    priceFeeds: config.priceFeeds,
  };

  chainConstantsCache.set(chainId, constants);
  return constants;
}

// ---------------------------------------------------------------------------
// Default chain constants (backward compat for non-hook contexts)
// ---------------------------------------------------------------------------

const defaultConstants = buildChainConstants(DEFAULT_CHAIN_ID);

export const USDC_ADDRESS = defaultConstants.usdcAddress;
export const USDC_DECIMALS = defaultConstants.usdcDecimals;
export const CHAINLINK_UNDERLYING_SYMBOLS = defaultConstants.chainlinkUnderlyingSymbols;
export const OPTION_IMPLEMENTATIONS = defaultConstants.optionImplementations;
export const COLLATERAL_TOKENS = defaultConstants.collateralTokens;
export const OPTION_FACTORY_ADDRESS = defaultConstants.optionFactoryAddress;
export const BASE_CONFIG = defaultConstants.config;
export const PRICE_FEEDS = defaultConstants.priceFeeds;

// Token addresses for quick access
const defaultConfig = defaultConstants.config;
export const WETH_ADDRESS = defaultConfig.tokens['WETH']?.address ?? '';
export const WETH_DECIMALS = defaultConfig.tokens['WETH']?.decimals ?? 18;
export const CBBTC_ADDRESS = defaultConfig.tokens['cbBTC']?.address ?? '';
export const CBBTC_DECIMALS = defaultConfig.tokens['cbBTC']?.decimals ?? 8;

// Collateral token mapping for option types
export const CALL_COLLATERAL: Record<string, { address: string; symbol: string; decimals: number }> = {
  ETH: { address: WETH_ADDRESS, symbol: 'WETH', decimals: WETH_DECIMALS },
  BTC: { address: CBBTC_ADDRESS, symbol: 'cbBTC', decimals: CBBTC_DECIMALS },
};

export const PUT_COLLATERAL = {
  address: USDC_ADDRESS,
  symbol: 'USDC',
  decimals: USDC_DECIMALS,
};

// Delivery token mapping for physical options
export const DELIVERY_TOKENS: Record<string, Record<string, { address: string; symbol: string }>> = {
  ETH: {
    CALL: { address: USDC_ADDRESS, symbol: 'USDC' },
    PUT: { address: WETH_ADDRESS, symbol: 'WETH' },
  },
  BTC: {
    CALL: { address: USDC_ADDRESS, symbol: 'USDC' },
    PUT: { address: CBBTC_ADDRESS, symbol: 'cbBTC' },
  },
};

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

export const getOptionInfo = (implementation: string, chainId: number = DEFAULT_CHAIN_ID): OptionImplementationInfo | null =>
  getOptionImplementationInfo(chainId as any, implementation);

export const getCollateralInfo = (address: string, chainId: number = DEFAULT_CHAIN_ID) => {
  const constants = buildChainConstants(chainId);
  return constants.collateralTokens[address.toLowerCase()] || null;
};

export const getUnderlyingSymbol = (priceFeed: string, chainId: number = DEFAULT_CHAIN_ID) => {
  const constants = buildChainConstants(chainId);
  return constants.chainlinkUnderlyingSymbols[priceFeed.toLowerCase()] || null;
};

export const calculateMaxContracts = (maxCollateral: number, strike: number, optionName: string) =>
  optionName === 'INVERSE_CALL' ? maxCollateral : maxCollateral / strike;

export const shortenAddress = (a: string | null | undefined) =>
  a ? `${a.slice(0, 6)}...${a.slice(-4)}` : '-';

export const floorToDecimals = (n: number, dp: number) =>
  Math.floor(n * 10 ** dp) / 10 ** dp;
