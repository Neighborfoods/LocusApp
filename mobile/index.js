/**
 * @format
 * Entry point. AppDelegate.mm expects moduleName "Locus" and bundle root "index".
 */
console.log('APP STARTING');

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { installGlobalErrorHandler } from './src/utils/logger';

installGlobalErrorHandler();

try {
  AppRegistry.registerComponent(appName, () => App);
  console.log('APP REGISTERED:', appName);
} catch (err) {
  console.error('APP REGISTRATION FAILED:', err);
  throw err;
}
