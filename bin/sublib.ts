#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import { gitSubtreeArgs, readConfig } from '../src/index';
import { generateForConsumer } from '../src/tsconfig_paths';

const runGit = (args: string[]): number => {
  const r = spawnSync('git', args, { stdio: 'inherit' });
  return r.status === null ? 1 : r.status;
};

const main = () => {
  const [, , subcmd, name] = process.argv;
  if (!subcmd) {
    console.error('Usage: sublib <add|pull|push> <name> | sublib gen');
    process.exit(1);
  }
  if (subcmd === 'gen') {
    try {
      const out = generateForConsumer(process.cwd());
      console.log(`[sublib] generated ${out}`);
      } catch (e: any) {
      console.warn('[sublib] paths generation failed:', e?.message || e);
    }
    process.exit(0);
  }
  if (!name) {
    console.error('Usage: sublib <add|pull|push> <name>');
    process.exit(1);
  }
  const cfg = readConfig();
  const code = runGit(gitSubtreeArgs(subcmd as any, name, cfg));
  if (code === 0 && subcmd === 'add') {
    try {
      const out = generateForConsumer(process.cwd());
      console.log(`[sublib] updated ${out}`);
    } catch (e: any) {
      console.warn('[sublib] paths generation failed:', e?.message || e);
    }
  }
  process.exit(code);
};

main();
