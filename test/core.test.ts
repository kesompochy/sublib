import { describe, it, expect } from 'bun:test';
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
});
