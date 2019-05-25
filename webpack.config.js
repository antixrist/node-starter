/**
 * This config is for JetBrain's IDE only
 */

const path = require('path');

module.exports = {
  context: path.resolve('./src'),
  resolve: {
    extensions: ['.js', '.mjs', '.node'],
    alias: {
      '@': path.resolve('./src'),
      '~': path.resolve('./src'),
    },
  },
};
