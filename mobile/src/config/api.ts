/**
 * API config: simulator and production both use Oracle Cloud Node backend (Nginx :80).
 */
const API_BASE = 'http://129.146.186.180';

const ENV = {
  development: { API_URL: API_BASE },
  production: { API_URL: API_BASE },
};

const getEnv = () => (__DEV__ ? ENV.development : ENV.production);

export default getEnv();
