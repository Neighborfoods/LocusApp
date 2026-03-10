/**
 * @format
 * Entry point. AppDelegate.mm expects moduleName "Locus" and bundle root "index".
 */
console.log('APP STARTING');

import { AppRegistry } from 'react-native';
import App from './App';
import { installGlobalErrorHandler } from './src/utils/logger';

installGlobalErrorHandler();

try {
  AppRegistry.registerComponent('Locus', () => App);
  console.log('APP REGISTERED: Locus');
} catch (err) {
  console.error('APP REGISTRATION FAILED:', err);
  throw err;
}
