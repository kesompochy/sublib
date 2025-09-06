#!/usr/bin/env bun
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { gitSubtreeArgs, readConfig } from '../src/index';

const run = (args: string[]) => {
  const r = spawnSync('git', args, { stdio: 'inherit' });
  process.exit(r.status === null ? 1 : r.status);
};

const main = () => {
  const [, , subcmd, name] = process.argv;
  if (!subcmd || !name) {
    console.error('Usage: sublib <add|pull|push> <name>');
    process.exit(1);
  }
  const cfg = readConfig();
  run(gitSubtreeArgs(subcmd as any, name, cfg));
};

main();
