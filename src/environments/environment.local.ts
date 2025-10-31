export const environment = {
  production: false,
  name: 'local',
  apiUrl: 'http://localhost:8080/api/v1',
  version: '1.0.0-dev',
  enableDebug: true,
  logLevel: 'verbose',
  features: {
    analytics: false,
    logging: true,
  },
  moduleHost: new Map([
    ['LOCAL_DOMAIN_URI', 'http://localhost:8080/api/v1'],
    ['MOCK_WS_DOMAIN', 'wss://s15414.nyc1.piesocket.com/v3/1?api_key=1yrj6Xk1Bjaovzqc2Y6Smz64ToXdB8rEj1BTFnAI&notify_self=1'],
  ]),
};
