import path from 'node:path';
import fs from 'node:fs';
import type { Plugin } from 'vite';
import { readConfig, buildAliases, optimizeExclude } from './index';

const sublib = (): Plugin => ({
  name: 'sublib',
  enforce: 'pre',
  config(config) {
    const root = config.root ? path.resolve(config.root) : process.cwd();
    const pkg = JSON.parse(fs.readFileSync(path.resolve(root, 'package.json'), 'utf-8'));
    const cfg = pkg.sublib || { root: 'vendor', libs: {} };
    const aliases = buildAliases(cfg, root);
    const aliasArr = Array.isArray(config.resolve?.alias)
      ? (config.resolve!.alias as any[])
      : Object.entries(config.resolve?.alias || {}).map(([find, replacement]) => ({ find, replacement }));
    const merged = [...aliasArr, ...aliases];
    const exclude = new Set([...(config.optimizeDeps?.exclude || []), ...optimizeExclude(cfg, root)]);
    return {
      resolve: { preserveSymlinks: true, alias: merged },
      optimizeDeps: { exclude: Array.from(exclude) },
      server: { watch: { ignored(p: string) { return p.includes(`${path.sep}node_modules${path.sep}`); } } },
    };
  }
});

export default sublib;
