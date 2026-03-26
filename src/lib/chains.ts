import { CHAIN_CONFIGS_BY_ID, isChainIdSupported, getChainConfigById } from '@thetanuts-finance/thetanuts-client';

export const SUPPORTED_CHAIN_IDS = Object.keys(CHAIN_CONFIGS_BY_ID).map(Number);
export const DEFAULT_CHAIN_ID = SUPPORTED_CHAIN_IDS[0];
export { isChainIdSupported, getChainConfigById, CHAIN_CONFIGS_BY_ID };
