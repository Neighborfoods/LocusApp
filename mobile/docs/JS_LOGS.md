# Viewing JavaScript logs (Metro / iOS)

Use these to see `console.log`, `console.error`, and which component crashed.

## 1. Metro terminal (primary)

- **Start Metro in a visible terminal:**  
  `npm run clean:start` or `npm run start`
- **All JS `console.log` / `console.error` appear in that Metro terminal** once the app has loaded the bundle and is connected.
- If you see **"APP STARTING"** then **"APP REGISTERED: LocusTemp"**, the entry point ran. If you then see **"APP ERROR BOUNDARY: …"**, the error message and `componentStack` tell you which component crashed.

## 2. iOS system / native logs (simulator)

- In a **second terminal**, from `mobile/`:  
  `npm run log:ios`
- This runs `react-native log-ios` and streams simulator + device logs (native and JS). Useful if Metro isn’t open or you want one place for all logs.

## 3. Quick checklist for “white screen” / “No bundle URL present”

1. **Metro must be running** and reachable at `http://localhost:8081` (e.g. run `npm run clean:start`).
2. **Simulator must load the bundle:**  
   If you see “No bundle URL present”, the app can’t reach Metro. Ensure:
   - `ios/LocusTemp/Info.plist` allows localhost (e.g. `NSAllowsLocalNetworking` and `NSExceptionDomains` for `localhost`).
3. **Check Metro output:**  
   Look for “APP STARTING” and “APP REGISTERED”. If they appear, the crash is in your component tree; look for “APP ERROR BOUNDARY” and the stack/componentStack in the same Metro terminal.
