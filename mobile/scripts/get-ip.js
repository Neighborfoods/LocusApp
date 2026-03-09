#!/usr/bin/env node
/**
 * Finds the host machine's LAN IP and injects it into the app config so the iOS Simulator
 * can reach the backend (localhost/127.0.0.1 is isolated in the simulator).
 *
 * Usage: npm run get-ip
 * Then restart Metro and rebuild the app if already running.
 *
 * Easy prefix change: set API_PATH_PREFIX below (e.g. '' for no prefix, or '/api/v1').
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const configPath = path.join(root, 'src', 'config', 'apiHost.generated.js');

// ── Easy prefix change: backend route prefix ('' = no prefix; '/api/v1' = with prefix) ──
// Port 9000 avoids collision with Metro/RN (8081 often hijacked)
const API_PORT = 9000;
const API_PATH_PREFIX = '';  // Backend returns 404 for /api/v1/auth/register; use '' so requests hit /auth/register

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

const ip = getLanIP();
const pathPart = API_PATH_PREFIX ? (API_PATH_PREFIX.startsWith('/') ? API_PATH_PREFIX : `/${API_PATH_PREFIX}`) : '';
const apiBaseUrl = `http://${ip}:${API_PORT}${pathPart}`.replace(/\/$/, '');

const content = `/**
 * Injected by: npm run get-ip
 * Do not edit manually. Run \`npm run get-ip\` to set your Mac's LAN IP for iOS Simulator.
 */
module.exports = {
  API_BASE_URL: '${apiBaseUrl}',
};
`;

fs.writeFileSync(configPath, content, 'utf8');

console.log('[get-ip] Host LAN IP:', ip);
console.log('[get-ip] API URL:', apiBaseUrl);
console.log('[get-ip] Wrote', path.relative(root, configPath));
console.log('[get-ip] Restart Metro and rebuild the app if it is already running.');
console.log('');
