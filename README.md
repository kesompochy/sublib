# @kesompochy/sublib

Local subtree dev setup: git subtree + bundler (Vite) integration.

## CLI (Bun)

- Global link (dev):
  - `bun link --global` in this directory
  - Then use `sublib <add|pull|push> <name>`
- Global install (after publishing):
  - `bun add -g @kesompochy/sublib`

## Vite plugin

Import in your `vite.config.ts`:

```ts
import sublib from '@kesompochy/sublib/vite';
export default defineConfig({ plugins: [sublib()] });
```

## Config (package.json)

```json
{
  "sublib": {
    "root": "vendor",
    "libs": {
      "egak.js": { "url": "git@github.com:kesompochy/egak.js.git", "branch": "master" }
    }
  }
}
```
