export const environment = {
  production: true,
  name: 'production',
  apiUrl: 'https://api.cargoguard.com/api',
  version: '1.0.0',
  enableDebug: false,
  logLevel: 'error',
  features: {
    analytics: true,
    logging: false
  },
  moduleHost: new Map([
    ["PRODUCTION_DOMAIN_URI", "https://api.cargoguard.com/api"],
    ['MOCK_WS_ENDPOINT', 'wss://uixd.co.uk:50001'],
  ])
};