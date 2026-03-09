# LOCUS — Cursor AI Build Guide
**Collaborative Housing Platform**
Stack: Go 1.21 + Gin | PostgreSQL 16 + PostGIS | Redis 7 | React Native CLI 0.73.4 | TypeScript

---

## 🏠 What Is Locus?

Locus helps people who **can't afford their homes alone** — due to job loss, high mortgage rates, divorce, or loss of a loved one.

**How it works:**
1. Users join a **Community** (group of property owners)
2. Everyone moves into a shared **host house**
3. Freed properties are **rented out**; income is distributed by **equity %**
4. Equity % = your property value ÷ total community value × 100
5. Members can **vote** on community decisions; homeowners have **final veto** over their own property
6. Members can **transfer** between communities across cities/states
7. **P2P rentals** (car, tools): profit goes ONLY to item owner, not the fund
8. **Community Fund** accumulates for future property purchases

---

## ⚙️ Rules You MUST Follow

- **NO Expo**, **NO @expo/ packages** — React Native CLI only
- All money stored as **int64 cents** (never floats). `formatCents()` for display
- Dark theme only: `bg: #08080F`, `primary: #5B4FE8`, `accent: #00C896`
- TypeScript strict mode — no `any` types unless unavoidable
- Equity % is **dynamic** (recalculated from DB); snapshot stored in `MemberEarning` at distribution time
- KYC + background check consent required before joining a community
- JWT: access token 15min, refresh token 7 days
- Store tokens in `react-native-keychain` (NOT AsyncStorage)

---

## 📦 Approved Packages

### Mobile (react-native-* only)
```
react-native 0.73.4          # Core
@react-navigation/native     # Navigation
@react-navigation/native-stack
@react-navigation/bottom-tabs
react-native-screens
react-native-safe-area-context
react-native-gesture-handler
react-native-reanimated      # ALL animations (spring: damping:20 stiffness:200)
react-native-linear-gradient # NOT expo-linear-gradient
react-native-vector-icons    # MaterialCommunityIcons
react-native-maps            # Google Maps provider + custom pins
react-native-fast-image      # ALL remote images
react-native-keychain        # Token storage
react-native-mmkv            # Fast key-value cache
react-native-permissions     # Camera, location, notifications
react-native-haptic-feedback # Haptics
@gorhom/bottom-sheet         # Modal sheets
@tanstack/react-query        # Server state + caching
zustand                      # Global state (auth, map, UI)
axios                        # HTTP client
react-hook-form              # All forms
zod + @hookform/resolvers    # Validation
date-fns                     # Date formatting
```

### Backend (Go modules)
```
github.com/gin-gonic/gin v1.9.1
github.com/golang-jwt/jwt/v5 v5.2.0
github.com/google/uuid v1.6.0
github.com/gorilla/websocket v1.5.1
github.com/redis/go-redis/v9 v9.4.0
go.uber.org/zap v1.26.0
golang.org/x/crypto v0.17.0
gorm.io/driver/postgres v1.5.4
gorm.io/gorm v1.25.5
```

---

## 🗂️ Project Structure

```
locus-app/
├── backend/
│   ├── cmd/server/main.go              ✅ Complete (50+ routes)
│   ├── internal/
│   │   ├── models/                     ✅ user, community, property, finance, governance
│   │   ├── handlers/                   ✅ auth_handler, community_handler (implement more)
│   │   ├── services/                   ✅ auth_service, community_service (implement more)
│   │   ├── repositories/               ✅ interfaces.go (implement GORM versions)
│   │   └── middleware/                 ✅ auth_middleware
│   └── pkg/
│       ├── auth/jwt.go                 ✅ Complete
│       └── response/response.go        ✅ Complete
│
├── mobile/
│   ├── src/
│   │   ├── api/                        ✅ client, auth, communities, voting, notifications
│   │   ├── hooks/                      ✅ useWebSocket, usePagination, usePermissions
│   │   ├── navigation/                 ✅ Root, Auth, App navigators
│   │   ├── screens/
│   │   │   ├── auth/                   ✅ Splash, Onboarding, Login, Register, ForgotPassword
│   │   │   ├── home/                   ✅ HomeScreen
│   │   │   ├── map/                    ✅ MapScreen (Google Maps + pins)
│   │   │   ├── community/              ✅ Communities, CommunityDetail
│   │   │   ├── finance/                ✅ FinanceScreen
│   │   │   ├── voting/                 ✅ VotingScreen
│   │   │   └── profile/                ✅ ProfileScreen
│   │   ├── store/authStore.ts          ✅ Zustand auth store
│   │   ├── theme/                      ✅ Colors, Spacing, Typography, Shadows
│   │   ├── types/models.ts             ✅ All TypeScript interfaces
│   │   └── utils/                      ✅ keychain, formatters
│
├── docker-compose.yml                  ✅ Complete
├── nginx/nginx.conf                    ✅ Complete
├── .env.example                        ✅ Complete
├── Makefile                            ✅ Complete
└── scripts/init.sql                    ✅ Complete
```

---

## 🔨 Prompt 1 — Implement GORM Repositories

**File:** `backend/internal/repositories/gorm/`

Create GORM implementations for ALL repository interfaces defined in `repositories/interfaces.go`:

```
gorm/user_repository.go
gorm/community_repository.go
gorm/membership_repository.go
gorm/finance_repository.go
gorm/property_repository.go
gorm/vote_repository.go
gorm/notification_repository.go
```

Requirements:
- Use `*gorm.DB` injected via constructor
- All queries must use soft deletes (`DeletedAt`)
- `FindNearby` must use PostGIS: `ST_DWithin(geography(ST_MakePoint(longitude, latitude)), geography(ST_MakePoint($lng, $lat)), $radiusMeters)`
- `List` communities must support: full-text search via `pg_trgm`, sort by rating/member_count/available_rooms/created_at, pagination with `OFFSET` + `LIMIT`
- `DistributeToMembers` must: 1) get distributable balance from fund, 2) get all active memberships with equity_percent, 3) calculate each member's share, 4) create MemberEarning records, 5) deduct from fund — all in a single DB transaction
- Return `*response.Meta` with total, page, page_size, total_pages

---

## 🔨 Prompt 2 — WebSocket Hub

**File:** `backend/internal/websocket/hub.go`, `client.go`, `events.go`

Build a WebSocket hub for real-time events:

Events to implement:
```go
const (
  EventNewVote          = "vote:new"
  EventVoteCast         = "vote:cast"
  EventVoteResult       = "vote:result"
  EventOwnerVeto        = "vote:veto"
  EventIncomeDistributed = "finance:distribution"
  EventMemberApproved   = "member:approved"
  EventMemberJoined     = "member:joined"
  EventTransferRequest  = "transfer:request"
  EventNotification     = "notification"
)
```

Requirements:
- Hub manages `map[communityID]map[connectionID]*Client`
- Auth via JWT query param: `/ws?token=...&community=...`
- Ping/pong keepalive every 30s
- Broadcast to community room or specific user
- Graceful disconnect cleanup

---

## 🔨 Prompt 3 — Remaining Backend Handlers

**Files:** `handlers/vote_handler.go`, `handlers/property_handler.go`, `handlers/notification_handler.go`, `handlers/finance_handler.go`

Pattern to follow (from existing `community_handler.go`):
- Handler gets service injected via constructor
- Extract IDs from path params
- Validate input with `ShouldBindJSON`
- Call service method
- Return via `response.*` helpers

**VoteHandler methods:**
- `List(c)` — GET /communities/:id/votes
- `Create(c)` — POST /communities/:id/votes
- `Get(c)` — GET /communities/:id/votes/:voteId
- `Cast(c)` — POST /communities/:id/votes/:voteId/cast
- `Veto(c)` — POST /communities/:id/votes/:voteId/veto (only property owner)
- `Close(c)` — POST /communities/:id/votes/:voteId/close (admin only)
- `Results(c)` — GET /communities/:id/votes/:voteId/results

**VetoHandler must check:** user owns `target_property_id` in the vote before allowing veto.

---

## 🔨 Prompt 4 — Equity Calculator

**File:** `backend/pkg/equity/calculator.go`

```go
package equity

// CalculateMemberEquities recalculates equity percentages for all active
// members in a community based on their contributed property values.
// Returns map[membershipID]equityPercent
func CalculateMemberEquities(memberships []MemberWithValue) map[uuid.UUID]float64

type MemberWithValue struct {
    MembershipID uuid.UUID
    PropertyValueCents int64
}
```

Rules:
- Total = sum of all property values
- Each member equity = (propertyValue / total) * 100
- Precision: round to 4 decimal places
- Must sum to exactly 100.0 (handle rounding error by adjusting largest member)
- If total = 0, return equal distribution

---

## 🔨 Prompt 5 — CreateCommunity Screen (Mobile)

**File:** `mobile/src/screens/community/CreateCommunityScreen.tsx`

Multi-step form (3 steps):
1. **Basic Info**: name, description, type (urban/suburban/rural/resort/commercial with icons), is_public toggle
2. **Location**: address, city, state, interactive map to drop pin (lat/lng), capacity slider (2–50 members)
3. **Property**: select which property you're contributing (from user's properties), show equity preview ("As founder with this property value, your starting equity will be ~100%")

UI requirements:
- Step indicator at top
- `react-hook-form` + `zod` for each step
- Map pin placement uses `react-native-maps` `onPress` on MapView
- LinearGradient submit button
- On success: navigate to `CommunityDetail`

---

## 🔨 Prompt 6 — Apply to Community Screen (Mobile)

**File:** `mobile/src/screens/community/ApplyCommunityScreen.tsx`

Multi-step application flow:
1. **Property Selection**: list user's unassigned properties, select one, show estimated value input
2. **Equity Preview**: animated pie chart showing "after you join, your equity will be ~X%", show projected monthly earnings estimate
3. **Background Check Consent**: display consent text, checkbox, submit

UI requirements:
- `@gorhom/bottom-sheet` for property picker
- Animated equity visualization using `react-native-reanimated`
- Loading state on submit
- Error handling with shake animation

---

## 🔨 Prompt 7 — Map Screen Enhancements (Mobile)

**File:** `mobile/src/screens/map/MapScreen.tsx` (already exists, extend it)

Add these features:
1. **Cluster nearby pins** when zoomed out (use `react-native-map-clustering` or manual distance grouping)
2. **Search bar overlay** with location autocomplete
3. **Filter bottom sheet** (community type, min rating, available rooms only, lifestyle tags)
4. **My location button** that animates map to user's position using `react-native-permissions`
5. **Property mode**: show individual property pins with rent price labels

---

## 🔨 Prompt 8 — Finance Screen Enhancements (Mobile)

**File:** `mobile/src/screens/finance/FinanceScreen.tsx` (already exists, extend it)

Add:
1. **Earnings chart**: 6-month bar chart using `react-native-reanimated` animated bars (no external chart lib)
2. **Property earnings breakdown**: each contributed property → monthly rent → my share after equity
3. **Fund growth projection**: simple linear projection based on avg monthly income
4. **Export button**: share CSV of earnings history

---

## 🔨 Prompt 9 — Item Rentals (P2P) Screen

**File:** `mobile/src/screens/rentals/ItemRentalsScreen.tsx`

Features:
- Browse items available for rent in user's community
- Categories: car, tools, appliances, sports, electronics
- Each item: photo (FastImage), price per day (in cents), owner info, availability calendar
- Book item: date range picker, confirm + pay
- My items: list items I've added for rent, track bookings, earnings

Key business rule: **Item rental profit goes ONLY to the item owner** — NOT to the community fund

---

## 🔨 Prompt 10 — Notifications Screen

**File:** `mobile/src/screens/notifications/NotificationsScreen.tsx`

Features:
- Group notifications by date (Today, Yesterday, This Week)
- Notification types with icons:
  - `vote:new` → purple vote icon → "New vote in [Community]"
  - `vote:result` → green checkmark → "Vote passed: [title]"
  - `vote:veto` → red gavel → "Owner vetoed: [title]"
  - `finance:distribution` → gold coin → "You earned [amount] from [community]"
  - `member:approved` → blue checkmark → "Your application was approved"
  - `transfer:approved` → arrows → "Transfer to [community] approved"
- Swipe-to-delete with `react-native-gesture-handler`
- Mark all as read button
- Real-time updates via `useWebSocket` hook

---

## 🔨 Prompt 11 — Professional Directory

**File:** `mobile/src/screens/community/ProfessionalDirectoryScreen.tsx`

Doctors, nurses, lawyers, financial advisors living in the community.

Features:
- List professionals by category (Medical, Legal, Financial, Tech, Education)
- Each card: name, title, years experience, photo, verified badge, contact button
- Contact is in-app message (not exposing phone/email publicly)
- Admins can add/remove professionals

---

## 🔨 Prompt 12 — CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

Jobs:
1. **backend-test**: go test with testcontainers-go (real Postgres + Redis, no mocks)
2. **frontend-check**: tsc --noEmit + eslint --max-warnings 0
3. **docker-build**: Build + push to GHCR on main push
4. **deploy**: SSH deploy to VPS via `appleboy/ssh-action` (docker compose pull + up)
5. **android-build**: `npx react-native build-android --mode=release` (only on tags)

Secrets needed:
```
DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY
GHCR token (github.token)
```

---

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone <repo>
cd locus-app
make setup     # creates .env from .env.example

# 2. Edit .env with your DB password and JWT secrets

# 3. Start everything
make docker-up

# API: http://localhost:8080/health
# DB:  psql postgresql://locus:password@localhost:5432/locus

# 4. Run mobile (after docker-up)
cd mobile && npm install
npx react-native run-android   # or run-ios
```

---

## 🔑 Key Business Logic Summary

| Concept | Implementation |
|---|---|
| Equity % | `property_value_cents / community_total_value_cents * 100` |
| Monthly distribution | Fund balance × (1 - reserve_pct) distributed proportionally |
| Homeowner veto | Vote.target_property_id → only that property's owner can veto |
| P2P rental profit | Goes to item.owner_id ONLY (not community fund) |
| Community transfer | member moves from community A to B; equity recalculated in both |
| KYC gate | background_check_consent = true + kyc_verified = true required to join |
| Real-time events | WebSocket hub, JWT auth via ?token= query param |
| Money precision | Always int64 cents; display with formatCents() |

---

*Built with ❤️ — Locus: because everyone deserves a home.*
