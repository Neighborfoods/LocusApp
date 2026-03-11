export interface MapFilters {
  radius: number;
  propertyType: 'all' | 'house' | 'apartment' | 'studio';
  priceMin: number;
  priceMax: number;
  bedroomsMin: number;
  communityType: 'all' | 'equity' | 'cooperative' | 'rental';
  sortBy: 'distance' | 'price_asc' | 'price_desc' | 'newest';
}

export const DEFAULT_FILTERS: MapFilters = {
  radius: 25,
  propertyType: 'all',
  priceMin: 0,
  priceMax: 10000,
  bedroomsMin: 0,
  communityType: 'all',
  sortBy: 'distance',
};
