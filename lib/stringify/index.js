/**
 * Module dependencies.
 */
const Compressed = require('./compress');
const Identity = require('./identity');

/**
 * Stringify the given AST `node`.
 *
 * Options:
 *  - `compress` space-optimized output
 *  - `sourcemap` return an object with `.code` and `.map`
 *
 * @param {Object} node - The AST node to compile.
 * @param {Object} [options] - Compilation options.
 * @return {String|Object} - Compiled code, or an object with `code` and `map` if sourcemap is enabled.
 * @api public
 */
module.exports = function(node, options = {}) {
  // Choose the appropriate compiler based on the options
  const CompilerClass = options.compress ? Compressed : Identity;
  const compiler = new CompilerClass(options);

  // Error handling for missing node
  if (!node) {
    throw new Error('AST node is required for compilation.');
  }

  // Memoization cache
  const cache = new Map();

  /**
   * Compile function with memoization to improve performance.
   * @param {Object} node - The AST node to compile.
   * @return {String} - Compiled code.
   */
  function compileWithMemoization(node) {
    const nodeKey = JSON.stringify(node);

    if (cache.has(nodeKey)) {
      return cache.get(nodeKey);
    }

    const code = compiler.compile(node);
    cache.set(nodeKey, code);

    return code;
  }

  // Handle source maps if requested
  if (options.sourcemap) {
    const sourcemaps = require('./source-map-support');
    sourcemaps(compiler);

    const code = compileWithMemoization(node);
    compiler.applySourceMaps();

    const map = options.sourcemap === 'generator' ? compiler.map : compiler.map.toJSON();

    return { code, map };
  }

  // Compile without source maps
  return compileWithMemoization(node);
};
