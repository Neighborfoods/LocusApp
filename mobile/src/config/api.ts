/**
 * API config: HTTP for TestFlight (self-signed cert bypass). Use HTTPS + CA cert for App Store.
 */
const API_BASE = 'http://129.146.186.180';

const ENV = {
  development: { API_URL: API_BASE },
  production: { API_URL: API_BASE },
};

const getEnv = () => (__DEV__ ? ENV.development : ENV.production);

export default getEnv();
