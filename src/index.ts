import fs from 'node:fs';
import path from 'node:path';

export type SublibConfig = { root: string; libs: Record<string, { url: string; branch?: string }> };

export const readConfig = (cwd: string = process.cwd()): SublibConfig => {
  const pkgPath = path.resolve(cwd, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const conf = pkg.sublib || { root: 'vendor', libs: {} };
  return { root: conf.root || 'vendor', libs: conf.libs || {} } as SublibConfig;
};

export const vendorDir = (name: string, cfg: SublibConfig, cwd: string = process.cwd()): string =>
  path.resolve(cwd, cfg.root, name);

export const hasVendor = (name: string, cfg: SublibConfig, cwd: string = process.cwd()): boolean =>
  fs.existsSync(vendorDir(name, cfg, cwd));

export const listLibs = (cfg: SublibConfig, cwd: string = process.cwd()): string[] => {
  const names = Object.keys(cfg.libs || {});
  if (names.length) return names;
  const root = path.resolve(cwd, cfg.root || 'vendor');
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
};

export const buildAliases = (cfg: SublibConfig, cwd: string = process.cwd()): { find: string; replacement: string }[] => {
  const aliases: { find: string; replacement: string }[] = [];
  for (const name of listLibs(cfg, cwd)) {
    const dir = vendorDir(name, cfg, cwd);
    if (!fs.existsSync(dir)) continue;
    const src = fs.existsSync(path.join(dir, 'src')) ? path.join(dir, 'src') : dir;
    aliases.push({ find: name, replacement: src });
  }
  return aliases;
};

export const optimizeExclude = (cfg: SublibConfig, cwd: string = process.cwd()): string[] => listLibs(cfg, cwd);

export const gitSubtreeArgs = (
  subcmd: 'add' | 'pull' | 'push',
  name: string,
  cfg: SublibConfig,
): string[] => {
  const lib = cfg.libs[name];
  if (!lib) throw new Error(`Unknown lib: ${name}`);
  const url = lib.url;
  const ref = lib.branch || 'master';
  const prefix = path.posix.join(cfg.root, name);
  if (subcmd === 'add') return ['subtree', 'add', '--prefix', prefix, url, ref, '--squash'];
  if (subcmd === 'pull') return ['subtree', 'pull', '--prefix', prefix, url, ref, '--squash'];
  return ['subtree', 'push', '--prefix', prefix, url, ref];
};
