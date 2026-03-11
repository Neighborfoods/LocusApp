/**
 * Geocoding via Nominatim (OpenStreetMap). Free, no API key.
 * User-Agent required by ToS. Debounce and encodeURIComponent used for security/rate limiting.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org';

export interface GeocodingResult {
  name: string;
  lat: number;
  lng: number;
  displayName: string;
  type: 'city' | 'address' | 'region';
}

export const GeocodingService = {
  async search(query: string): Promise<GeocodingResult[]> {
    if (!query || query.trim().length < 2) return [];
    try {
      const encoded = encodeURIComponent(query.trim());
      const url = `${NOMINATIM_URL}/search?q=${encoded}&format=json&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'LOCUS-App/1.0.2 (locushousing@app.com)',
          'Accept-Language': 'en',
        },
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      return data.map((item: any) => ({
        name:
          item.address?.city ||
          item.address?.town ||
          item.address?.county ||
          item.name ||
          query,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
        type:
          item.type === 'city'
            ? 'city'
            : item.type === 'administrative'
              ? 'region'
              : 'address',
      }));
    } catch (error) {
      if (__DEV__) console.warn('Geocoding error:', error);
      return [];
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `${NOMINATIM_URL}/reverse?lat=${lat}&lon=${lng}&format=json`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'LOCUS-App/1.0.2 (locushousing@app.com)' },
      });
      const data = await response.json();
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.county ||
        'Unknown location'
      );
    } catch {
      return 'Unknown location';
    }
  },
};
