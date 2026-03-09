// ── Domain Types (mirrors backend models) ────────────────────────────────────

export type UserRole = 'member' | 'owner' | 'admin' | 'moderator';
export type KYCStatus = 'pending' | 'verified' | 'rejected';
export type HousingReason = 'job_loss' | 'loss_of_loved_one' | 'high_mortgage_rates' | 'divorce' | 'exploring' | 'other';
export type CommunityType = 'urban' | 'suburban' | 'resort' | 'remote' | 'co_living';
export type MemberStatus = 'applicant' | 'approved' | 'active' | 'paused' | 'exited';
export type MembershipRole = 'member' | 'moderator' | 'admin' | 'founder';
export type PropertyType = 'house' | 'apartment' | 'condo' | 'studio' | 'room';
export type PropertyStatus = 'available' | 'contributed' | 'listed_external' | 'occupied' | 'for_sale';
export type VoteType = 'renovation' | 'new_member' | 'fund_purchase' | 'rule_change' | 'expense' | 'general';
export type VoteResult = 'passed' | 'rejected' | 'tied';
export type ItemCategory = 'car' | 'bike' | 'tools' | 'electronics' | 'furniture' | 'sport' | 'other';

// ── User ─────────────────────────────────────────────────────────────────────

export interface UserPublicProfile {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url?: string;
  bio?: string;
  professional_title?: string;
  hobbies: string[];
  kyc_status: KYCStatus;
  verification_score: number;
  city?: string;
  state?: string;
  created_at: string;
}

export interface UserPrivateProfile extends UserPublicProfile {
  email: string;
  phone?: string;
  role: UserRole;
  housing_reason: HousingReason;
  is_active: boolean;
  last_login_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  user: UserPrivateProfile;
  access_token: string;
  refresh_token: string;
}

// ── Community ─────────────────────────────────────────────────────────────────

export interface Community {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  type: CommunityType;
  lifestyle_tags: string[];
  founder_id: string;
  founder?: UserPublicProfile;
  host_property_id?: string;
  host_property?: Property;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  capacity: number;
  available_rooms: number;
  member_count: number;
  cover_url?: string;
  avatar_url?: string;
  images: string[];
  amenities: string[];
  rules_document_url?: string;
  fund_balance_cents: number;
  reserve_pct: number;
  rating: number;
  total_value_cents: number;
  total_earnings_cents: number;
  is_public: boolean;
  is_accepting_members: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  // joined metadata
  my_membership?: Membership;
}

export interface Membership {
  id: string;
  user_id: string;
  community_id: string;
  user?: UserPublicProfile;
  role: MembershipRole;
  status: MemberStatus;
  equity_percent: number;
  contributed_property_id?: string;
  contributed_property?: Property;
  room_number?: string;
  joined_at: string;
  exit_cost_cents: number;
}

export interface CommunityMapPin {
  id: string;
  name: string;
  type: CommunityType;
  latitude: number;
  longitude: number;
  member_count: number;
  capacity: number;
  available_rooms: number;
  rating: number;
  avatar_url?: string;
}

export interface WaitingListEntry {
  id: string;
  community_id: string;
  user_id: string;
  user?: UserPublicProfile;
  position: number;
  message?: string;
  created_at: string;
}

export interface TransferRequest {
  id: string;
  user_id: string;
  from_community_id: string;
  to_community_id: string;
  to_community?: Community;
  reason?: string;
  status: 'pending' | 'approved' | 'waitlisted' | 'rejected';
  created_at: string;
}

// ── Property ──────────────────────────────────────────────────────────────────

export interface Property {
  id: string;
  owner_id: string;
  owner?: UserPublicProfile;
  community_id?: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  bedrooms: number;
  bathrooms: number;
  area_sqft: number;
  year_built?: number;
  rooms: number;
  estimated_value_cents: number;
  images: string[];
  amenities: string[];
  is_resort_property: boolean;
  views_count: number;
  created_at: string;
}

export interface PropertyMapPin {
  id: string;
  latitude: number;
  longitude: number;
  status: PropertyStatus;
  type: PropertyType;
  estimated_value_cents: number;
  city: string;
}

// ── Finance ───────────────────────────────────────────────────────────────────

export interface FundSummary {
  community_id: string;
  balance_cents: number;
  reserve_pct: number;
  reserve_amount_cents: number;
  available_cents: number;
  total_earnings_cents: number;
  last_distribution?: string;
}

export interface FundTransaction {
  id: string;
  community_id: string;
  type: 'rental_income' | 'distribution' | 'expense' | 'reserve' | 'purchase';
  amount_cents: number;
  description: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
}

export interface MemberEarning {
  id: string;
  membership_id: string;
  community_id: string;
  user_id: string;
  equity_pct_at_time: number;
  amount_cents: number;
  period: string;
  status: 'pending' | 'paid' | 'held';
  paid_at?: string;
  created_at: string;
}

export interface ItemRental {
  id: string;
  owner_id: string;
  owner?: UserPublicProfile;
  community_id: string;
  title: string;
  description?: string;
  category: ItemCategory;
  price_per_day_cents: number;
  deposit_cents: number;
  images: string[];
  condition: 'new' | 'excellent' | 'good' | 'fair';
  is_available: boolean;
  created_at: string;
}

export interface ItemBooking {
  id: string;
  item_id: string;
  item?: ItemRental;
  renter_id: string;
  renter?: UserPublicProfile;
  start_date: string;
  end_date: string;
  total_days: number;
  total_amount_cents: number;
  deposit_paid_cents: number;
  status: 'pending' | 'active' | 'returned' | 'cancelled';
  returned_at?: string;
  notes?: string;
  created_at: string;
}

// ── Governance ────────────────────────────────────────────────────────────────

export interface Vote {
  id: string;
  community_id: string;
  creator_id: string;
  creator?: UserPublicProfile;
  title: string;
  description?: string;
  type: VoteType;
  target_property_id?: string;
  target_property?: Property;
  estimated_cost_cents?: number;
  status: 'active' | 'closed' | 'cancelled';
  result?: VoteResult;
  owner_veto_used: boolean;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  total_eligible: number;
  expires_at: string;
  closed_at?: string;
  created_at: string;
  // User-specific
  my_ballot?: 'yes' | 'no' | 'abstain';
}

export interface VoteResultResponse {
  vote_id: string;
  title: string;
  status: string;
  result?: VoteResult;
  owner_veto_used: boolean;
  yes_count: number;
  no_count: number;
  abstain_count: number;
  total_voted: number;
  total_eligible: number;
  yes_pct: number;
  no_pct: number;
  abstain_pct: number;
  closed_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  community_id?: string;
  type: string;
  title: string;
  body?: string;
  data: Record<string, unknown>;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface ProfessionalEntry {
  id: string;
  user_id: string;
  user?: UserPublicProfile;
  community_id: string;
  title: string;
  description?: string;
  available_for_community: boolean;
  created_at: string;
}

// ── API ───────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}
