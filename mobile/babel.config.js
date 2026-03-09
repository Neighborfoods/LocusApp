const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: [path.resolve(__dirname, 'src')],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': path.resolve(__dirname, 'src'),
          '@components': path.resolve(__dirname, 'src/components'),
          '@screens': path.resolve(__dirname, 'src/screens'),
          '@navigation': path.resolve(__dirname, 'src/navigation'),
          '@store': path.resolve(__dirname, 'src/store'),
          '@api': path.resolve(__dirname, 'src/api'),
          '@hooks': path.resolve(__dirname, 'src/hooks'),
          '@utils': path.resolve(__dirname, 'src/utils'),
          '@types': path.resolve(__dirname, 'src/types'),
          '@theme': path.resolve(__dirname, 'src/theme'),
        },
      },
    ],
    'react-native-reanimated/plugin', // MUST be last
  ],
};
