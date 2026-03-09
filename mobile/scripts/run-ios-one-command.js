#!/usr/bin/env node
/**
 * One-command iOS run: kills port 8081, clears DerivedData, starts Metro in a
 * new Terminal window (so you see bundling logs), waits for Metro to be fully
 * ready (/status returns "packager-status:running"), then runs react-native run-ios.
 *
 * Use: npm run run:ios
 * Fixes: bundle not loading (race), EADDRINUSE, build DB lock, and hidden Metro logs.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const http = require('http');

const PORT = 8081;
const PROJECT_NAME = 'Locus';
const root = path.resolve(__dirname, '..');
const rnCli = path.join(root, 'node_modules', 'react-native', 'cli.js');
const derivedRoot = path.join(os.homedir(), 'Library', 'Developer', 'Xcode', 'DerivedData');

function killPort(port) {
  if (process.platform !== 'darwin' && process.platform !== 'linux') return;
  try {
    const pid = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (pid) {
      execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      console.log(`Killed process on port ${port} (PID ${pid})\n`);
    }
  } catch (_) {}
}

function clearDerivedData() {
  try {
    const entries = fs.readdirSync(derivedRoot);
    const toRemove = entries.filter((e) => e.startsWith(`${PROJECT_NAME}-`));
    for (const dir of toRemove) {
      try {
        fs.rmSync(path.join(derivedRoot, dir), { recursive: true, maxRetries: 3 });
        console.log(`Cleared DerivedData: ${dir}`);
      } catch (_) {}
    }
    if (toRemove.length > 0) console.log('');
  } catch (_) {}
}

function waitForPort(port, maxWaitMs = 10000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function attempt() {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > maxWaitMs) return resolve(false);
        setTimeout(attempt, 400);
      });
      socket.connect(port, '127.0.0.1');
    }
    attempt();
  });
}

/** Wait for Metro /status to return "packager-status:running" so bundle can be served. */
function waitForMetroStatus(maxWaitMs = 90000) {
  const start = Date.now();
  return new Promise((resolve) => {
    function attempt() {
      const req = http.get(
        `http://127.0.0.1:${PORT}/status`,
        { timeout: 5000 },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            if (data.trim() === 'packager-status:running') {
              return resolve(true);
            }
            if (Date.now() - start > maxWaitMs) return resolve(false);
            setTimeout(attempt, 1500);
          });
        }
      );
      req.on('error', () => {
        if (Date.now() - start > maxWaitMs) return resolve(false);
        setTimeout(attempt, 1500);
      });
      req.on('timeout', () => {
        req.destroy();
        if (Date.now() - start > maxWaitMs) return resolve(false);
        setTimeout(attempt, 1500);
      });
    }
    attempt();
  });
}

/** Open a new Terminal window and run Metro so the user sees bundling progress. */
function startMetroInNewTerminal() {
  if (process.platform !== 'darwin') {
    console.warn('Metro will run in background; use "npm run clean:start" in another terminal to see logs.\n');
    const metro = spawn(process.execPath, [rnCli, 'start', '--reset-cache'], {
      cwd: root,
      stdio: 'ignore',
      detached: true,
    });
    metro.unref();
    return;
  }
  const cmd = `cd "${root}" && node "${rnCli}" start --reset-cache`;
  try {
    execSync(
      `osascript -e 'tell application "Terminal" to do script "${cmd.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"'`,
      { stdio: 'inherit' }
    );
  } catch (e) {
    console.warn('Could not open new Terminal window; starting Metro in background.', e.message);
    const metro = spawn(process.execPath, [rnCli, 'start', '--reset-cache'], {
      cwd: root,
      stdio: 'ignore',
      detached: true,
    });
    metro.unref();
  }
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Kill CoreSimulatorService to fix "Unable to lookup in current state: Shutdown". */
function killCoreSimulatorService() {
  if (process.platform !== 'darwin') return;
  try {
    execSync('killall -9 com.apple.CoreSimulator.CoreSimulatorService 2>/dev/null || true', {
      stdio: 'pipe',
    });
    console.log('Reset CoreSimulatorService (if it was running).\n');
  } catch (_) {}
}

/** Kill dangling Xcode processes to prevent "database is locked" on next build. */
function killXcodeProcesses() {
  if (process.platform !== 'darwin') return;
  try {
    execSync('killall -9 xcodebuild 2>/dev/null || true', { stdio: 'pipe' });
    execSync('killall -9 XCBBuildService 2>/dev/null || true', { stdio: 'pipe' });
  } catch (_) {}
}

/** Pre-build: kill xcodebuild and remove build.db to fix "database is locked" forever. */
function preBuildCleanup() {
  if (process.platform !== 'darwin') return;
  try {
    execSync('killall -9 xcodebuild 2>/dev/null || true', { stdio: 'pipe' });
    const buildDb = path.join(root, 'ios', 'build', 'build.db');
    if (fs.existsSync(path.join(root, 'ios', 'build'))) {
      try {
        fs.rmSync(buildDb, { force: true });
        console.log('Removed ios/build/build.db (prevents database is locked).\n');
      } catch (_) {}
    }
  } catch (_) {}
}

function exitWithCleanup(code) {
  killXcodeProcesses();
  process.exit(code ?? 0);
}

async function main() {
  preBuildCleanup();
  killPort(PORT);
  killCoreSimulatorService();
  clearDerivedData();
  await delay(2000); // Let OS release filesystem lock before xcodebuild

  console.log('Opening Metro in a new Terminal window (watch bundling progress there)...\n');
  startMetroInNewTerminal();

  await delay(3000);

  console.log('Waiting for Metro to listen on port 8081...');
  const portOk = await waitForPort(PORT);
  if (!portOk) {
    console.error('Metro did not start on port 8081. Check the Metro Terminal window for errors.');
    process.exit(1);
  }
  console.log('Port 8081 is open. Waiting for Metro to be ready to serve the bundle (/status)...');

  const statusOk = await waitForMetroStatus();
  if (!statusOk) {
    console.error(
      'Metro did not report "packager-status:running" in time. The app may show "No bundle URL present".\n' +
        'Check the Metro Terminal window; ensure it shows "Loading dependency graph" then "Welcome to Metro".'
    );
    process.exit(1);
  }

  console.log('Metro is ready. Building and launching iOS app...\n');
  if (process.platform === 'darwin') {
    try {
      execSync('open -a Simulator', { stdio: 'pipe' });
      await delay(2000);
      execSync('osascript -e \'tell application "Simulator" to activate\'', { stdio: 'pipe' });
    } catch (_) {}
  }

  const launchLogPath = path.join(root, 'ios-launch.log');
  try {
    const logStream = spawn(
      'xcrun',
      ['simctl', 'spawn', 'booted', 'log', 'stream', '--predicate', 'processImagePath CONTAINS "Locus"', '--level', 'debug'],
      { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], detached: true }
    );
    const out = fs.createWriteStream(launchLogPath, { flags: 'w' });
    logStream.stdout?.pipe(out);
    logStream.stderr?.pipe(out);
    logStream.unref();
    setTimeout(() => {
      try {
        logStream.kill('SIGTERM');
      } catch (_) {}
    }, 10_000);
    console.log(`System log stream (first 10s) writing to ${path.relative(root, launchLogPath)}\n`);
  } catch (e) {
    console.warn('Could not start simulator log stream:', e?.message ?? e, '\n');
  }

  const ios = spawn(process.execPath, [rnCli, 'run-ios'], {
    cwd: root,
    stdio: 'inherit',
  });
  ios.on('error', (err) => {
    console.error(err);
    exitWithCleanup(1);
  });
  ios.on('close', (code) => {
    killXcodeProcesses();
    process.exit(code ?? 0);
  });

  process.on('SIGINT', () => {
    killXcodeProcesses();
    process.exit(0);
  });
  process.on('SIGTERM', () => {
    killXcodeProcesses();
    process.exit(0);
  });
}

main();
