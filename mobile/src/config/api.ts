/**
 * Environment-based API config. __DEV__ = development, else production.
 * TestFlight/production uses Oracle Cloud backend.
 */
const ENV = {
  development: {
    API_URL: 'http://localhost:3000',
  },
  production: {
    API_URL: 'http://129.146.186.180',
  },
};

const getEnv = () => {
  return __DEV__ ? ENV.development : ENV.production;
};

export default getEnv();
