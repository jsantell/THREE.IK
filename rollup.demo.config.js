const rollup = require('rollup');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const cleanup = require('rollup-plugin-cleanup');

export default {
  input: 'demo/index.js',
  external: ['three'],
  output: [{
    file: './demo/build.js',
    format: 'umd',
    name: 'App',
  }],
  globals: {
    'three': 'THREE',
  },
  plugins: [
    resolve(),
    commonjs(),
    cleanup(),
  ],
};
