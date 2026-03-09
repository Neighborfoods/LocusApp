#!/usr/bin/env node
/**
 * One-command fix: reinstall deps, patch broken packages, relink iOS pods.
 * Use: npm run fix:links
 * Fixes "unknown command start", missing .bin links, and native module linking.
 */
const { execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

console.log('Reinstalling dependencies (--legacy-peer-deps)...\n');
execSync('npm install --legacy-peer-deps', { cwd: root, stdio: 'inherit' });

console.log('\nPatching error-stack-parser if needed...\n');
require('./patch-error-stack-parser.js');

console.log('\nVerifying React Native CLI...');
try {
  execSync('node node_modules/react-native/cli.js start --help', {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf8',
  });
  console.log('OK: react-native start is available.\n');
} catch (e) {
  console.error('React Native CLI still broken. Try: rm -rf node_modules && npm install --legacy-peer-deps');
  process.exit(1);
}

console.log('Re-linking iOS Pods...\n');
try {
  execSync('pod install', { cwd: path.join(root, 'ios'), stdio: 'inherit' });
} catch (e) {
  console.warn('pod install failed (run manually from mobile/ios if needed).');
}

console.log('\nDone. You can run: npm run clean:start or npm run run:ios');
