import { format, formatDistanceToNow, parseISO } from 'date-fns';

// ── Currency (all amounts stored in cents) ────────────────────────────────────

export const formatCents = (cents: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
};

export const formatCentsExact = (cents: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
};

export const formatLargeValue = (cents: number): string => {
  const dollars = cents / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}K`;
  return formatCents(cents);
};

// ── Date & Time ───────────────────────────────────────────────────────────────

export const formatDate = (iso: string, fmt = 'MMM d, yyyy'): string => {
  try {
    return format(parseISO(iso), fmt);
  } catch {
    return iso;
  }
};

export const formatRelative = (iso: string): string => {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
};

export const formatShortDate = (iso: string): string => formatDate(iso, 'MMM d');

// ── Numbers ───────────────────────────────────────────────────────────────────

export const formatPercent = (value: number, decimals = 1): string =>
  `${value.toFixed(decimals)}%`;

export const formatNumber = (n: number): string =>
  new Intl.NumberFormat('en-US').format(n);

// ── Equity ────────────────────────────────────────────────────────────────────

export const calculateEquity = (
  propertyValueCents: number,
  totalCommunityValueCents: number,
): number => {
  if (totalCommunityValueCents === 0) return 0;
  return (propertyValueCents / totalCommunityValueCents) * 100;
};

// ── Distance ─────────────────────────────────────────────────────────────────

export const formatDistance = (km: number): string => {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
};

// ── Area ─────────────────────────────────────────────────────────────────────

export const formatSqft = (sqft: number): string =>
  `${formatNumber(sqft)} sqft`;

// ── Housing reason labels ─────────────────────────────────────────────────────

export const HOUSING_REASON_LABELS: Record<string, string> = {
  job_loss:           'Lost my job',
  loss_of_loved_one:  'Lost a loved one',
  high_mortgage_rates:'Mortgage rates too high',
  divorce:            'Going through a divorce',
  exploring:          'Just exploring',
  other:              'Other reason',
};

export const COMMUNITY_TYPE_LABELS: Record<string, string> = {
  urban:     'Urban',
  suburban:  'Suburban',
  resort:    'Resort',
  remote:    'Remote',
  co_living: 'Co-living',
};

export const VOTE_TYPE_LABELS: Record<string, string> = {
  renovation:    'Renovation',
  new_member:    'New Member',
  fund_purchase: 'Fund Purchase',
  rule_change:   'Rule Change',
  expense:       'Expense',
  general:       'General',
};

export const ITEM_CATEGORY_LABELS: Record<string, string> = {
  car:         'Car',
  bike:        'Bicycle / Scooter',
  tools:       'Tools',
  electronics: 'Electronics',
  furniture:   'Furniture',
  sport:       'Sports Equipment',
  other:       'Other',
};
