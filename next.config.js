const path = require('path');
const { CHAIN_CONFIGS_BY_ID } = require('@thetanuts-finance/thetanuts-client');

// Collect all unique domains from all chain configs for CSP and rewrites
const allChainConfigs = Object.values(CHAIN_CONFIGS_BY_ID);
const cspDomains = new Set();
const proxyRewrites = [];

for (const config of allChainConfigs) {
  // API endpoints (added to CSP for SSR fallback)
  for (const url of [config.apiBaseUrl, config.indexerApiUrl, config.pricingApiUrl, config.stateApiUrl]) {
    try { cspDomains.add(new URL(url).origin); } catch {}
  }
  // WebSocket
  if (config.wsBaseUrl) {
    try { cspDomains.add(new URL(config.wsBaseUrl).origin); } catch {}
  }

  // RPC proxy: env RPC_URL_{chainId} -> /proxy/rpc/{chainId}
  // Keeps Ankr API keys server-side, never exposed to browser
  const rpcEnv = process.env[`RPC_URL_${config.chainId}`];
  const rpcUrl = rpcEnv || config.defaultRpcUrls[0];
  proxyRewrites.push({
    source: `/proxy/rpc/${config.chainId}`,
    destination: rpcUrl,
  });
  // Add RPC domain to CSP (the proxy target domain)
  try { cspDomains.add(new URL(rpcUrl).origin); } catch {}

  // API proxy rewrites per chain
  proxyRewrites.push(
    {
      source: `/proxy/api/${config.chainId}/:path*`,
      destination: `${config.apiBaseUrl}/:path*`,
    },
    {
      source: `/proxy/state/${config.chainId}/:path*`,
      destination: `${config.stateApiUrl}/:path*`,
    },
    {
      source: `/proxy/pricing/${config.chainId}/:path*`,
      destination: `${config.pricingApiUrl}/:path*`,
    },
  );
}

// Kyber swap proxy (not chain-specific)
cspDomains.add('https://web.thetanuts.finance');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  env: {
    WALLET_CONNECT_PROJECT_ID: process.env.WALLET_CONNECT_PROJECT_ID,
    REFERRER_ADDRESS: process.env.REFERRER_ADDRESS,
    KYBER_SWAP_URL: process.env.KYBER_SWAP_URL,
  },
  webpack: (config, { isServer }) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        'fs/promises': false,
      };
    }
    return config;
  },
  async rewrites() {
    return [
      ...proxyRewrites,
      {
        source: '/proxy/kyber/:path*',
        destination: 'https://web.thetanuts.finance/kyber/:path*',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data: https://fonts.gstatic.com https://*.walletconnect.com",
              `connect-src 'self' ${[...cspDomains].join(' ')} wss://base-rpc.thetanuts.finance wss://relay.walletconnect.com wss://relay.walletconnect.org https://api.web3modal.com https://api.web3modal.org https://pulse.walletconnect.org https://*.walletconnect.com https://rpc.walletconnect.com https://rpc.walletconnect.org https://*.reown.com`,
              "frame-src 'self' https://verify.walletconnect.com https://verify.walletconnect.org",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
