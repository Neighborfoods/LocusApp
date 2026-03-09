#!/usr/bin/env node
/**
 * Deep-clean: remove node_modules and lockfiles, clear npm cache, reinstall with
 * --legacy-peer-deps. Fixes corrupted node_modules (e.g. regexpu-core / Babel
 * "Cannot find module './data/i-bmp-mappings.js'") and ensures react-native-maps
 * and react-native-fast-image are correctly integrated.
 *
 * Use: npm run clean:deep
 * Then: npm run clean:start or npm run run:ios
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const root = path.resolve(__dirname, '..');

function run(cmd, opts = {}) {
  execSync(cmd, { cwd: root, stdio: 'inherit', ...opts });
}

console.log('=== Deep clean (mobile) ===\n');

// 1. Remove node_modules (use shell rm -rf for resilience to locked files / EPERM)
const nodeModules = path.join(root, 'node_modules');
if (fs.existsSync(nodeModules)) {
  console.log('Removing node_modules...');
  try {
    execSync(`rm -rf "${nodeModules}"`, { cwd: root, stdio: 'pipe' });
    console.log('Done.\n');
  } catch (e) {
    console.error('Failed to remove node_modules:', e.message);
    console.error('Run manually: rm -rf node_modules && npm run clean:deep');
    process.exit(1);
  }
} else {
  console.log('node_modules not present.\n');
}

// 2. Remove lockfiles (both npm and yarn to avoid mixed state)
const lockfiles = ['package-lock.json', 'yarn.lock'];
for (const name of lockfiles) {
  const file = path.join(root, name);
  if (fs.existsSync(file)) {
    console.log(`Removing ${name}...`);
    fs.unlinkSync(file);
  }
}
console.log('');

// 3. Force clear npm cache
console.log('Clearing npm cache (--force)...');
try {
  run('npm cache clean --force');
  console.log('Cache cleared.\n');
} catch (e) {
  console.warn('npm cache clean failed (non-fatal):', e.message, '\n');
}

// 4. Reinstall with --legacy-peer-deps
console.log('Installing dependencies (--legacy-peer-deps)...');
run('npm install --legacy-peer-deps');

// 5. Postinstall (patch error-stack-parser)
console.log('\nRunning postinstall (patch-error-stack-parser)...');
require('./patch-error-stack-parser.js');

// 6. Re-link iOS Pods
const iosDir = path.join(root, 'ios');
if (fs.existsSync(iosDir)) {
  console.log('\nRe-linking iOS Pods...');
  try {
    run('pod install', { cwd: iosDir });
    console.log('Pods installed.\n');
  } catch (e) {
    console.warn('pod install failed. Run manually from mobile/ios if needed.\n');
  }
}

console.log('=== Deep clean complete ===');
console.log('Next: npm run clean:start  (or npm run run:ios)\n');
