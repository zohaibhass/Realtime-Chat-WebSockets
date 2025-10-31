export const environment = {
  production: false,
  name: 'development',
  apiUrl: 'http://localhost:8080/api/v1',
  version: '1.0.0',
  enableDebug: true,
  logLevel: 'debug',
  features: {
    analytics: false,
    logging: true
  },
  moduleHost: new Map([
    ["LOCAL_DOMAIN_URI", "http://localhost:8080/api/v1"],
    ['MOCK_WS_ENDPOINT', 'wss://uixd.co.uk:50001'],
  ])
};