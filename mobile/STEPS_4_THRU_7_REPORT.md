# Steps 4–7 — Exact Output Report

## Step 4 — Verify Info.plist (ATS)

**Command:** `grep -A 5 "NSAppTransportSecurity" ~/Desktop/LocusApp/mobile/ios/Locus/Info.plist`

**Output:**
```
	<key>NSAppTransportSecurity</key>
	<dict>
		<key>NSAllowsArbitraryLoads</key>
		<true/>
	</dict>
	<key>NSLocationWhenInUseUsageDescription</key>
```

**Result:** ✅ **Present and correct.** No edit performed. ATS allows arbitrary loads (plaintext HTTP).

---

## Step 5 — (Not run; user asked 6 and 7)

Skipped per your steps.

---

## Step 6 — Install app on simulator and launch

**6a — Boot simulator**
```bash
xcrun simctl boot EBFB5C64-82C1-469E-96A8-0AA10EF97108 2>/dev/null
sleep 3
```
**Output:** (none; exit code 149 from wrapper)

**6b — Install**

Your script uses `~/Desktop/LocusApp/ios-build`. That directory **does not exist**. Used actual app path:
`$(find ~/Desktop/LocusApp/mobile/ios/DerivedData -name 'Locus.app' -type d | head -1)`

**Command:**
```bash
xcrun simctl install EBFB5C64-82C1-469E-96A8-0AA10EF97108 "$APP_PATH"
```
**Output:**
```
APP_PATH=/Users/peter.c/Desktop/LocusApp/mobile/ios/DerivedData/Locus-cttomwxdzllkikcecxcftetavnzi/Build/Products/Debug-iphonesimulator/Locus.app
An error was encountered processing the command (domain=IXErrorDomain, code=13):
Simulator device failed to install the application.
Missing bundle ID.
Underlying error (domain=IXErrorDomain, code=13):
	Failed to get bundle ID from .../Locus.app
	Missing bundle ID.
```

**Result:** ❌ **Install failed.** The built `Locus.app` in DerivedData is **incomplete**: it contains only a `Frameworks` directory — **no Info.plist**, no executable. So the bundle has no bundle ID and cannot be installed.

**6c — Launch:** Not run (install failed).

---

## Step 7 — Start Metro

**Command:**
```bash
cd ~/Desktop/LocusApp/mobile
npx react-native start --reset-cache
```
**Output:** (Metro started in background; no error.) Run this in a terminal and leave it running so you see the three success lines when the app runs.

---

## What you need to do to get DONE

1. **Produce a complete Locus.app** (with Info.plist and binary) by doing a **full build**:
   - **Option A:** In one terminal start Metro, then in a second:
     ```bash
     cd ~/Desktop/LocusApp/mobile
     npx react-native run-ios --simulator="iPhone 15 Pro" --no-packager
     ```
     This builds, installs, and launches in one go.
   - **Option B:** If you use `ios-build` as the install source, create it and point your build there:
     ```bash
     mkdir -p ~/Desktop/LocusApp/ios-build
     # Then build with -derivedDataPath ~/Desktop/LocusApp/ios-build (or copy built Locus.app there after a full build)
     ```
     Use a full xcodebuild that runs all phases (so the .app gets Info.plist and the app binary).

2. **After a successful install/launch**, in the Metro terminal you should see:
   - ✅ `[NET_REQ] GET http://129.146.186.180/health`
   - ✅ `[NET_RES] 200 http://129.146.186.180/health`
   - ✅ `[AUTH_STORE] isInitialized: true`

**Rules followed:** Backend IP, HTTPS, React Native version, and authentication logic were not changed.
