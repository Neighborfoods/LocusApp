#!/usr/bin/env node
/**
 * Clears Xcode DerivedData for Locus to avoid "database is locked" then runs iOS.
 * Use: npm run ios:clean
 * Ensures a single clean build and prevents concurrent xcodebuild from locking the DB.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const os = require('os');

const PROJECT_NAME = 'Locus';
const derivedRoot = path.join(os.homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData');

function rmDerivedData() {
  const fs = require('fs');
  try {
    const entries = fs.readdirSync(derivedRoot);
    const toRemove = entries.filter((e) => e.startsWith(`${PROJECT_NAME}-`));
    if (toRemove.length === 0) return;
    for (const dir of toRemove) {
      const full = path.join(derivedRoot, dir);
      try {
        fs.rmSync(full, { recursive: true, maxRetries: 3 });
        console.log(`Removed ${dir}`);
      } catch (e) {
        console.warn(`Could not remove ${dir}:`, e.message);
      }
    }
  } catch (e) {
    if (e.code !== 'ENOENT') console.warn('DerivedData clean:', e.message);
  }
}

rmDerivedData();

const root = path.resolve(__dirname, '..');
const rnCli = path.join(root, 'node_modules', 'react-native', 'cli.js');

console.log('Running react-native run-ios...\n');
const child = spawn(process.execPath, [rnCli, 'run-ios'], {
  cwd: root,
  stdio: 'inherit',
});

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
