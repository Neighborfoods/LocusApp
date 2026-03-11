# LOCUS QA Manual Checklist
## Features: Profile Photo Upload + Biometric Authentication
### Version: 1.0.2 | Date: 2026-03-10

---

## A. Profile Photo Upload

### A1. iOS Simulator (Photo Library)
- [ ] Tap avatar on Edit Profile → Action Sheet appears with correct options
- [ ] Action Sheet title shows "Profile Photo"
- [ ] Three options visible: "Take Photo", "Choose from Library", "Cancel"
- [ ] "Cancel" dismisses sheet without changes
- [ ] "Choose from Library" opens photo picker
- [ ] Selected photo appears in 96×96 circular avatar
- [ ] Camera badge (blue circle) always visible bottom-right of avatar
- [ ] "Edit" label visible below avatar in primary blue
- [ ] After selecting photo: "Remove Photo" appears as 4th (destructive red) option
- [ ] "Remove Photo" clears avatar back to placeholder icon
- [ ] Avatar persists after saving profile

### A2. Physical Device (Camera)
- [ ] "Take Photo" triggers camera permission prompt (first time)
- [ ] Granting permission opens native iOS camera
- [ ] Denying permission shows no crash (graceful failure)
- [ ] Photo taken appears immediately in avatar
- [ ] Camera unavailable on simulator shows no crash

### A3. Dark Mode
- [ ] Avatar placeholder background matches surface color in dark mode
- [ ] "Edit" label uses primary color (not hardcoded blue)

---

## B. Biometric Authentication — iOS (Face ID)

### B1. First-Time Setup
- [ ] Login successfully with email + password
- [ ] After successful login: Alert "Enable Face ID?" appears
- [ ] Tapping "Not Now" dismisses — no Face ID prompt on next launch
- [ ] Tapping "Enable" stores preference in AsyncStorage

### B2. Biometric Login Flow
- [ ] Relaunch app → Face ID prompt appears automatically (if enabled)
- [ ] Successful Face ID → navigates to Main screen without password
- [ ] Failed Face ID (3 attempts) → falls back to password form
- [ ] User taps "Use Password" → Face ID dismissed, password form focused

### B3. Settings Toggle
- [ ] Settings → Security section visible with Face ID row
- [ ] Toggle ON → Face ID verification required before enabling
- [ ] Toggle OFF → immediately disables without verification
- [ ] Toggle state persists across app restarts

### B4. Edge Cases
- [ ] Device without Face ID → Security section hidden in Settings
- [ ] Face ID button hidden on Login if not enabled
- [ ] No crash if biometric sensor unavailable

---

## C. Biometric Authentication — Android

### C1. Fingerprint
- [ ] Login with password → Alert "Enable Biometrics?" appears
- [ ] Enable → fingerprint prompt shown on next launch
- [ ] Fingerprint match → navigates to Main

### C2. Android Face Unlock
- [ ] Devices supporting face unlock: face prompt appears
- [ ] Fall back to fingerprint if face fails

---

## D. Regression — No Breaking Changes
- [ ] Login with email + password still works (no biometric)
- [ ] Register new account → no biometric prompt
- [ ] Forgot password flow unaffected
- [ ] Profile save with new photo updates displayed avatar in ProfileScreen
- [ ] All existing EditProfile fields (name, bio, phone) still save correctly
- [ ] Theme toggle (dark/light) still works in Settings
- [ ] GPS + Map screen unaffected
- [ ] Navigation between all 5 tabs works

---

## E. Performance
- [ ] Avatar photo loads in < 500ms after selection
- [ ] Face ID prompt appears in < 300ms after app launch
- [ ] No memory leak: rapidly open/close image picker 10 times → no crash

---

**Run automated tests:**
```bash
cd ~/Desktop/LocusApp/mobile
npx jest --testPathPattern="BiometricAuth|ProfilePhoto" --verbose
```
