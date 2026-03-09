#!/usr/bin/env node
/**
 * Prints the machine's LAN IP (e.g. 192.168.1.x) for use with iOS Simulator.
 * Usage: node scripts/get-lan-ip.js
 * Then: export EXPO_PUBLIC_LAN_IP=$(node scripts/get-lan-ip.js)
 */

const { execSync } = require('child_process');

function getLanIP() {
  if (process.platform === 'darwin') {
    try {
      const out = execSync('ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null', {
        encoding: 'utf8',
      }).trim();
      if (out && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(out)) return out;
    } catch (_) {}
  }
  if (process.platform === 'win32') {
    try {
      const out = execSync('ipconfig', { encoding: 'utf8' });
      const m = out.match(/IPv4 Address[.\s]*:\s*(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/);
      if (m) return m[1];
    } catch (_) {}
  }
  return '192.168.1.1';
}

console.log(getLanIP());
