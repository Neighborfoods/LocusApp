/**
 * Project CLI config so "react-native start" and other commands resolve correctly.
 * Re-exports commands from the react-native package (Metro start, run-ios, etc.).
 */
const ios = require('@react-native-community/cli-platform-ios');
const android = require('@react-native-community/cli-platform-android');
const {
  bundleCommand,
  ramBundleCommand,
  startCommand,
} = require('@react-native/community-cli-plugin');

module.exports = {
  commands: [
    ...ios.commands,
    ...android.commands,
    bundleCommand,
    ramBundleCommand,
    startCommand,
  ],
  platforms: {
    ios: {
      projectConfig: ios.projectConfig,
      dependencyConfig: ios.dependencyConfig,
    },
    android: {
      projectConfig: android.projectConfig,
      dependencyConfig: android.dependencyConfig,
    },
  },
};
