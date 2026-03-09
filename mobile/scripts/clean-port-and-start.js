#!/usr/bin/env node
/**
 * Kills any process on port 8081 (Metro) then starts React Native with reset cache.
 * Use: npm run clean:start
 * Prevents EADDRINUSE when a previous Metro instance didn't exit cleanly.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');

const PORT = 8081;

function killPort(port) {
  const plat = process.platform;
  if (plat === 'darwin' || plat === 'linux') {
    try {
      const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
      if (pid) {
        execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
        console.log(`Killed process on port ${port} (PID ${pid})`);
      }
    } catch (_) {
      // lsof exits 1 when no process uses the port — ignore
    }
    return;
  }
  if (plat === 'win32') {
    try {
      const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
      const lines = out.trim().split('\n').filter(Boolean);
      const pids = new Set();
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') pids.add(pid);
      }
      for (const pid of pids) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
          console.log(`Killed process on port ${port} (PID ${pid})`);
        } catch (_) {}
      }
    } catch (e) {
      if (e.status !== 1 && e.message && !e.message.includes('findstr')) {
        console.warn('clean-port:', e.message);
      }
    }
  }
}

killPort(PORT);

const root = path.resolve(__dirname, '..');
const rnCli = path.join(root, 'node_modules', 'react-native', 'cli.js');

console.log('Starting Metro with --reset-cache...\n');
const child = spawn(process.execPath, [rnCli, 'start', '--reset-cache'], {
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
