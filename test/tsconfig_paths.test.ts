import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildPaths, generateForConsumer, readSublibConfig } from '../src/tsconfig_paths';

const mkTmp = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'sublib-consumer-'));

const writeJson = (p: string, v: any): void => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
};

describe('tsconfig_paths', () => {
  let root: string;

  beforeEach(() => {
    root = mkTmp();
  });

  afterEach(() => {
    // best-effort cleanup
    try { fs.rmSync(root, { recursive: true, force: true }); } catch {}
  });

  it('reads sublib config from consumer package.json', () => {
    const pkg = {
      name: 'tmp',
      sublib: {
        root: 'vendor',
        libs: {
          'egak.js': { url: 'git@example/egak.js.git' },
          'ugocas.js': { url: 'git@example/ugocas.js.git' },
        },
      },
    };
    writeJson(path.join(root, 'package.json'), pkg);
    const cfg = readSublibConfig(root);
    expect(cfg.root).toBe('vendor');
    expect(Object.keys(cfg.libs)).toEqual(['egak.js', 'ugocas.js']);
  });

  it('builds TS paths for libs (prefers src/index.ts)', () => {
    // layout
    writeJson(path.join(root, 'package.json'), {
      sublib: { root: 'vendor', libs: { 'egak.js': {}, 'ugocas.js': {} } },
    });
    const egakSrc = path.join(root, 'vendor', 'egak.js', 'src');
    const ugocasDir = path.join(root, 'vendor', 'ugocas.js');
    fs.mkdirSync(egakSrc, { recursive: true });
    fs.mkdirSync(ugocasDir, { recursive: true });
    fs.writeFileSync(path.join(egakSrc, 'index.ts'), '// ok');

    const cfg = readSublibConfig(root);
    const p = buildPaths(root, cfg);
    const posix = (...s: string[]) => s.join('/');
    expect(p['egak.js'][0]).toBe(posix('vendor','egak.js','src','index.ts'));
    expect(p['egak.js/*'][0]).toBe(posix('vendor','egak.js','src','*'));
    // ugocas has no src -> maps to dir and wildcard under vendor/ugocas.js
    expect(p['ugocas.js'][0]).toBe(posix('vendor','ugocas.js'));
    expect(p['ugocas.js/*'][0]).toBe(posix('vendor','ugocas.js','*'));
  });

  it('generates tsconfig.sublib.json at repository root', () => {
    writeJson(path.join(root, 'package.json'), {
      sublib: { root: 'vendor', libs: { 'egak.js': {}, 'ugocas.js': {} } },
    });
    fs.mkdirSync(path.join(root, 'vendor', 'egak.js', 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'vendor', 'egak.js', 'src', 'index.ts'), '// ok');
    fs.mkdirSync(path.join(root, 'vendor', 'ugocas.js', 'src'), { recursive: true });

    const out = generateForConsumer(root);
    const expected = path.join(root, 'tsconfig.sublib.json');
    expect(out).toBe(expected);
    expect(fs.existsSync(expected)).toBe(true);
    const json = JSON.parse(fs.readFileSync(expected, 'utf-8'));
    expect(json.compilerOptions.baseUrl).toBe('.');
    expect(json.compilerOptions.preserveSymlinks).toBe(true);
    expect(Object.keys(json.compilerOptions.paths)).toContain('egak.js');
    expect(json.compilerOptions.paths['egak.js'][0]).toBe('vendor/egak.js/src/index.ts');
  });
});
