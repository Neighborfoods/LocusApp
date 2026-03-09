# TestFlight Launch Checklist

## App Store Connect (manual steps)

- [ ] Create App ID at [developer.apple.com](https://developer.apple.com) (Identifiers → App IDs)
- [ ] Bundle ID: **com.locus.app**
- [ ] Create new App in [App Store Connect](https://appstoreconnect.apple.com) (My Apps → +)
- [ ] Add internal testers (Users and Access → TestFlight → Internal Testing)
- [ ] Fill app description and category: **Real Estate**

## Build requirements

- [ ] App icon **1024×1024** (no alpha channel), set in Xcode → Assets.xcassets → AppIcon
- [ ] Launch screen configured (LaunchScreen.storyboard)
- [ ] Version: **1.0.0**, Build: **1**
- [ ] API base URL points to **http://129.146.186.180** (production config)
- [ ] No crashes on startup; test on device (not only simulator)

## Privacy (required by Apple)

- [ ] Privacy Policy URL (e.g. your website or GitHub Pages)
- [ ] Data collection disclosure in App Store Connect and in-app if you collect data

## Build workflow

This project is **bare React Native** (no Expo). Use **Xcode** or **Fastlane** to archive and upload to TestFlight.

## Bare React Native: TestFlight build steps

1. Open **mobile/ios/Locus.xcworkspace** in Xcode (or **Locus.xcodeproj**).
2. Select the **Locus** target → **Signing & Capabilities**.
3. Set **Team** to your Apple Developer account.
4. Confirm **Bundle Identifier**: `com.locus.app`.
5. **Product → Archive** (device must be “Any iOS Device”, not a simulator).
6. In Organizer: **Distribute App → App Store Connect → Upload**.
7. In App Store Connect, submit the build to TestFlight and add testers.

## Note on HTTP (129.146.186.180)

- **NSAllowsArbitraryLoads: true** is set for testing over HTTP.
- Before **public App Store** release, switch backend to **HTTPS** and set **NSAllowsArbitraryLoads** to **false** (or remove it) and use **NSExceptionDomains** only if needed.
