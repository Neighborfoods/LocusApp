# Fastlane (Locus — bare RN, zero Expo)

## Install

```bash
brew install fastlane
# or: gem install fastlane
```

## Setup

`Fastfile` and `Appfile` are pre-configured. To run the interactive setup (optional):

```bash
cd mobile/ios && fastlane init
```

If init overwrites `Fastfile`, restore the `beta` lane from repo or docs.

## Beta (TestFlight)

From `mobile/ios`:

```bash
fastlane beta
```

Requires: Xcode, Apple Developer account, App Store Connect API key or Apple ID in Keychain. Set `app_identifier`, `apple_id`, and `team_id` in `Appfile` or via env.
