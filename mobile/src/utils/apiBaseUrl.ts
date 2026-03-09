/**
 * Network bridge (__DEV__): LAN IP for simulator. Production: HTTPS API only.
 */

import { Platform } from 'react-native';

/** Production API base URL (Oracle Cloud). Use HTTPS before public App Store. */
const PRODUCTION_API_BASE_URL = 'http://129.146.186.180';

// Injected by npm run get-ip (src/config/apiHost.generated.js). Dev only.
let HOST_IP_BASE_URL = 'http://192.168.1.6:9000';
try {
  const generatedConfig = require('../config/apiHost.generated.js');
  if (generatedConfig?.API_BASE_URL) HOST_IP_BASE_URL = generatedConfig.API_BASE_URL;
} catch (_) {
  // Fallback when file missing
}

/** Dev: iOS = host LAN IP, Android = 10.0.2.2. Prod: HTTPS API. */
const BASE_URL = !__DEV__
  ? PRODUCTION_API_BASE_URL
  : Platform.OS === 'ios'
    ? HOST_IP_BASE_URL
    : 'http://10.0.2.2:9000';

/**
 * Returns the API base URL. EXPO_PUBLIC_API_URL overrides in both dev and prod.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) {
    try {
      new URL(explicit);
      return explicit.replace(/\/$/, '');
    } catch (_) {}
  }
  return BASE_URL;
}
