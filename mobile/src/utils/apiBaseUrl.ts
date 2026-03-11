/**
 * API base URL: simulator and production use Oracle Cloud Node backend (Nginx :80).
 */

/** Oracle Cloud Node backend — HTTP (Nginx :80). TestFlight with self-signed cert; use HTTPS + CA cert for App Store. */
const API_BASE_URL = 'http://129.146.186.180';

/**
 * Returns the API base URL. EXPO_PUBLIC_API_URL overrides if set.
 */
export function getApiBaseUrl(): string {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (explicit) {
    try {
      new URL(explicit);
      return explicit.replace(/\/$/, '');
    } catch (_) {}
  }
  return API_BASE_URL;
}
