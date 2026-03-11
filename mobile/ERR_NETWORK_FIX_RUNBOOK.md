# ERR_NETWORK Fix Runbook — iOS Simulator

## Status

- **Step 1 ✅** — `Info.plist` on disk is correct: `NSAllowsArbitraryLoads = true` (no NSExceptionDomains).
- **Step 2** — Nuclear clean was run (Xcode/Simulator killed, DerivedData/Caches/ios/build/Pods/Podfile.lock removed). You must **complete `pod install`** (see below).
- **Steps 3–6** — Run locally in order after pods are installed.

---

## Step 2 (finish): Pod install

If `ios/Pods` or `ios/Podfile.lock` is missing, run:

```bash
cd ~/Desktop/LocusApp/mobile/ios
pod install --repo-update
```

Wait until you see `Pod installation complete!`.

---

## Step 3: Uninstall old app from simulator

Use your **booted** simulator’s UDID (get it with `xcrun simctl list devices | grep Booted`). If you use iPhone 15 Pro, the UDID might be different from the one below — replace it:

```bash
# Get booted device UDID first:
xcrun simctl list devices | grep Booted

# Uninstall old Locus app (replace UDID if different):
xcrun simctl uninstall EBFB5C64-82C1-469E-96A8-0AA10EF97108 com.app.locushousing
```

---

## Step 4: Test network from simulator (before running app)

This checks whether the **simulator** can reach the server (not just your Mac). Boot the simulator first, then:

```bash
# Replace the UDID with your booted simulator’s UDID from Step 3
xcrun simctl spawn EBFB5C64-82C1-469E-96A8-0AA10EF97108 curl -s --max-time 5 http://129.146.186.180/health
```

- **Expected:** `{"status":"healthy",...}` or similar JSON.
- **If this fails:** Simulator has network isolation. Use **Step 6** (localhost proxy).

---

## Step 5: Verify ATS in built binary & rebuild and run

1. **Start Metro (Terminal 1):**
   ```bash
   cd ~/Desktop/LocusApp/mobile
   npx react-native start --reset-cache
   ```

2. **Build and run (Terminal 2), after Metro is up:**
   ```bash
   cd ~/Desktop/LocusApp/mobile
   npx react-native run-ios --simulator="iPhone 15 Pro" --no-packager
   ```

3. **Confirm ATS is in the built app:**
   ```bash
   find ~/Library/Developer/Xcode/DerivedData -name "Info.plist" -path "*/Locus.app/*" 2>/dev/null | head -1 | xargs grep -A3 "NSAppTransportSecurity"
   ```
   Expected: `NSAllowsArbitraryLoads` and `<true/>` (no NSExceptionDomains).

4. **Success in Metro:** You should see:
   - `[NET_REQ] ... GET http://129.146.186.180/health`
   - `[NET_RES] ... 200 http://129.146.186.180/health` (not ERR_NETWORK)
   - `[AUTH_STORE] isInitialized: true` and no “backend unreachable” warning.

---

## Step 6: If Step 4 failed (simulator cannot reach 129.146.186.180)

The simulator may be sandboxed. Use a **localhost proxy** so the app talks to `localhost` and the proxy forwards to the server:

1. **Install proxy (one of):**
   ```bash
   npm install -g local-ssl-proxy
   # or use ngrok
   ```

2. **Start proxy (Mac forwards localhost:3001 → 129.146.186.180:80):**
   ```bash
   npx local-ssl-proxy --source 3001 --target 80 --hostname 129.146.186.180
   ```
   Leave this running.

3. **Point app at localhost:** Set `API_BASE_URL` to `http://localhost:3001` in:
   - `src/utils/apiBaseUrl.ts` → `const API_BASE_URL = 'http://localhost:3001';`
   - `src/config/api.ts` → `const API_BASE = 'http://localhost:3001';`

4. Rebuild and run (Step 5). The simulator can reach `localhost`, and the proxy reaches the server.

---

## If xcodebuild still reports "database is locked"

- Quit Xcode completely.
- Run the **nuclear clean** again (kill Xcode/Simulator, remove DerivedData and `ios/build`), then run `pod install` and build from the command line with `npx react-native run-ios` (no Xcode GUI).
- Avoid opening the same project in Xcode and command line at the same time during the first build after clean.
