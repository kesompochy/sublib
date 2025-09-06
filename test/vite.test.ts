import { describe, it, expect } from 'bun:test';
import sublib from '../src/vite';

describe('vite plugin', () => {
  it('exposes plugin with name', () => {
    const p = (sublib as any)();
    expect(p && p.name).toBe('sublib');
  });
});
