'use strict';

if (typeof require === 'function' && require.resolve) {
  const resolveFn = require.resolve;
  if (typeof resolveFn.paths !== 'function') {
    const Module = require('module');
    const builtinModules = new Set(
      (Module.builtinModules || []).map((name) => name.replace(/^node:/, '')),
    );

    Object.defineProperty(resolveFn, 'paths', {
      value(request) {
        const normalized = String(request || '').replace(/^node:/, '');
        if (builtinModules.has(normalized)) return null;
        return Array.isArray(Module.globalPaths)
          ? Module.globalPaths.slice()
          : [];
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}
