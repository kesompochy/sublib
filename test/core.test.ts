import { describe, it, expect } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readConfig, buildAliases, gitSubtreeArgs } from '../src/index';

describe('sublib core', () => {
  it('reads config with defaults', () => {
    const cfg = readConfig();
    expect(cfg.root).toBe('vendor');
  });
  it('builds subtree args', () => {
    const cfg = { root: 'vendor', libs: { foo: { url: 'git@example/foo.git', branch: 'main' } } } as any;
    expect(gitSubtreeArgs('add', 'foo', cfg)).toEqual([
      'subtree','add','--prefix','vendor/foo','git@example/foo.git','main','--squash'
    ]);
  });
  it('runs generation on "sublib add" (side-effect)', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'sublib-add-'));
    // consumer package.json
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({
      name: 'tmp',
      sublib: { root: 'vendor', libs: { 'egak.js': { url: 'git@example/egak.js.git' } } },
    }));
    // prepare a lib layout so paths include it
    const libSrc = path.join(cwd, 'vendor', 'egak.js', 'src');
    fs.mkdirSync(libSrc, { recursive: true });
    fs.writeFileSync(path.join(libSrc, 'index.ts'), '// ok');

    // fake git in PATH returning success
    const bindir = fs.mkdtempSync(path.join(os.tmpdir(), 'fake-git-'));
    const gitPath = path.join(bindir, 'git');
    fs.writeFileSync(gitPath, `#!/usr/bin/env bash
exit 0
`);
    fs.chmodSync(gitPath, 0o755);

    const bin = path.resolve(__dirname, '..', 'bin', 'sublib.ts');
    const r = spawnSync('bun', [bin, 'add', 'egak.js'], { cwd, env: { ...process.env, PATH: `${bindir}:${process.env.PATH}` } });
    expect(r.status).toBe(0);
    const generated = path.join(cwd, 'tsconfig.sublib.json');
    expect(fs.existsSync(generated)).toBe(true);
    const json = JSON.parse(fs.readFileSync(generated, 'utf-8'));
    expect(json.compilerOptions.baseUrl).toBe('.');
    expect(Object.keys(json.compilerOptions.paths)).toContain('egak.js');
  });
  it('runs manual generation via "sublib gen"', () => {
    const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'sublib-gen-'));
    fs.writeFileSync(path.join(cwd, 'package.json'), JSON.stringify({
      name: 'tmp',
      sublib: { root: 'vendor', libs: { 'ugocas.js': {} } },
    }));
    const libDir = path.join(cwd, 'vendor', 'ugocas.js');
    fs.mkdirSync(libDir, { recursive: true });

    const bin = path.resolve(__dirname, '..', 'bin', 'sublib.ts');
    const r = spawnSync('bun', [bin, 'gen'], { cwd });
    expect(r.status).toBe(0);
    expect(fs.existsSync(path.join(cwd, 'tsconfig.sublib.json'))).toBe(true);
  });
});
