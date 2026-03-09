#!/usr/bin/env node
/**
 * Fixes error-stack-parser package whose "main" points to a missing file.
 * Run after npm install so "react-native start" and other CLI commands work.
 */
const path = require('path');
const fs = require('fs');

const pkgPath = path.join(__dirname, '..', 'node_modules', 'error-stack-parser', 'package.json');
try {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  if (pkg.main === './error-stack-parser.js') {
    const distPath = path.join(path.dirname(pkgPath), 'dist', 'error-stack-parser.js');
    if (fs.existsSync(distPath)) {
      pkg.main = './dist/error-stack-parser.js';
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('Patched error-stack-parser main -> dist/error-stack-parser.js');
    }
  }
} catch (e) {
  if (e.code !== 'ENOENT') console.warn('patch-error-stack-parser:', e.message);
}
