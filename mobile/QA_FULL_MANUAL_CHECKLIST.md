# LOCUS Full App QA Manual Checklist
## All Screens + Performance + Regression
### Version 1.0.2 | Build 3 | 2026-03-10

---

## DEVICE MATRIX
Test on:
- [ ] iPhone 15 Pro (iOS 17) — Dynamic Island
- [ ] iPhone 13 (iOS 16) — Notch
- [ ] iPhone SE (iOS 15) — No notch
- [ ] iOS Simulator (iPhone 15 Pro)

---

## A. AUTHENTICATION SCREENS

### A1. RegisterScreen
- [ ] All fields validate (name, email, password)
- [ ] Weak password shows inline error
- [ ] Invalid email shows inline error
- [ ] Submit with empty fields shows errors
- [ ] Successful register navigates to Main
- [ ] Keyboard avoids covering inputs
- [ ] "Already have account?" link navigates to Login
- [ ] Avatar/photo not cut by Dynamic Island

### A2. LoginScreen
- [ ] Email + password login works
- [ ] Wrong password shows error
- [ ] Face ID button visible when enabled
- [ ] Face ID auto-prompts on launch (if enabled)
- [ ] "Forgot Password?" navigates correctly
- [ ] "Don't have account?" navigates to Register
- [ ] Error clears when user starts typing

### A3. ForgotPasswordScreen
- [ ] Invalid email shows error
- [ ] Valid email shows success message
- [ ] Back button works

---

## B. MAP SCREEN (Tab 2)

### B1. Layout
- [ ] Search bar NOT behind Dynamic Island
- [ ] Filter pills visible and tappable
- [ ] FAB (+) accessible above tab bar
- [ ] Location button centers map on user
- [ ] Bottom status shows correct counts

### B2. Functionality
- [ ] GPS blue dot appears on map
- [ ] "All" filter shows both communities + properties
- [ ] "Communities" filter shows only communities
- [ ] "Properties" filter shows only properties
- [ ] Search bar filters results
- [ ] Tapping a pin shows preview card
- [ ] Preview card navigates to detail

---

## C. HOME SCREEN (Tab 1)

### C1. Performance
- [ ] Screen loads under 2 seconds
- [ ] No blank flash on load
- [ ] Pull-to-refresh works
- [ ] Scroll is smooth (60fps)

### C2. Content
- [ ] User name shows correctly
- [ ] Earnings banner shows data
- [ ] Nearby communities load
- [ ] Quick action buttons navigate correctly
- [ ] Empty state shows when no data

---

## D. COMMUNITIES SCREEN (Tab 3)

- [ ] List loads with data or empty state
- [ ] Search filters communities
- [ ] Pull-to-refresh works
- [ ] Tapping community → Community Detail
- [ ] Apply button on Community Detail works
- [ ] Members list loads
- [ ] Voting section works

---

## E. INSIGHTS/FINANCE SCREEN (Tab 4)

- [ ] Transaction list loads
- [ ] Earnings summary shows
- [ ] Community chips filter correctly
- [ ] Empty state with no transactions

---

## F. PROFILE SCREEN (Tab 5)

### F1. Profile View
- [ ] User name and email display
- [ ] Avatar displays (or placeholder)
- [ ] All 11 menu items navigate correctly
- [ ] Logout works and returns to Login

### F2. Edit Profile
- [ ] Avatar NOT behind Dynamic Island ← KEY FIX
- [ ] Avatar tappable (Action Sheet appears)
- [ ] "Take Photo" opens camera (device only)
- [ ] "Choose from Library" opens picker
- [ ] "Remove Photo" clears avatar
- [ ] Photo appears in 96×96 circle
- [ ] Camera badge visible bottom-right
- [ ] All fields (name, bio, phone) save correctly
- [ ] "Edit" label below avatar in primary color
- [ ] Save success navigates back

### F3. Settings
- [ ] Light / Dark / System theme works
- [ ] ALL screens update when theme changes
- [ ] Face ID toggle visible (if available)
- [ ] Face ID toggle ON requires Face ID verify
- [ ] Change Password flow works

---

## G. NOTIFICATIONS

- [ ] Unread count badge on Profile tab
- [ ] Mark individual as read
- [ ] Mark all as read
- [ ] Empty state shows correctly

---

## H. THEME AUDIT (Switch Light ↔ Dark on every screen)

For each screen, verify in BOTH light and dark:
- [ ] Home — background, text, cards
- [ ] Map — pills, top bar, status bar text
- [ ] Communities — list items, search bar
- [ ] Insights — transaction rows, header
- [ ] Profile — menu items, header
- [ ] Edit Profile — inputs, avatar placeholder
- [ ] Settings — rows, switches, header
- [ ] Login — background, inputs, buttons
- [ ] Register — background, inputs, buttons

---

## I. PERFORMANCE BENCHMARKS

- [ ] App cold launch to interactive: < 3 seconds
- [ ] Tab switch animation: < 16ms (60fps)
- [ ] API calls return: < 2 seconds
- [ ] Map tiles load: < 1 second
- [ ] Image picker response: < 500ms
- [ ] Face ID prompt: < 300ms
- [ ] Scroll 100 items FlatList: no jank
- [ ] Memory stable after 10 min use

---

## J. EDGE CASES + REGRESSION

- [ ] Airplane mode: app shows error gracefully, no crash
- [ ] Slow network (3G): loading states show correctly
- [ ] Very long name/bio: text truncates correctly
- [ ] Landscape mode: portrait-only lock works
- [ ] Background/foreground: Face ID re-prompts correctly
- [ ] Multiple rapid taps: no double navigation
- [ ] iOS back swipe gesture: works everywhere
- [ ] Keyboard dismiss: tap outside input dismisses
- [ ] All CAPS keyboard bug: not present on device

---

## K. ACCESSIBILITY

- [ ] All tap targets ≥ 44×44pt
- [ ] VoiceOver labels on icon buttons
- [ ] Color contrast ratio ≥ 4.5:1
