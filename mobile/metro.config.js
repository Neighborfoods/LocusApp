const path = require('path');
const fs = require('fs');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const projectRoot = __dirname;

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      // Resolve @services/* alias so Metro can find modules
      if (moduleName.startsWith('@services/')) {
        const subPath = moduleName.replace(/^@services\//, '');
        const dir = path.join(projectRoot, 'src', 'services', path.dirname(subPath));
        const base = path.join(dir, path.basename(subPath));
        const extensions = ['.ts', '.tsx', '.native.ts', '.native.tsx', '.js', '.json'];
        for (const ext of extensions) {
          const candidate = base + ext;
          if (fs.existsSync(candidate)) {
            return { type: 'sourceFile', filePath: candidate };
          }
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
