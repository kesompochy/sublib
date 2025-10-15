# @kesompochy/sublib

Local subtree dev setup: git subtree + bundler integration.

## TypeScript paths (auto-generation)

- On install and on `sublib add <name>`, this tool generates `./tsconfig.sublib.json` at your repository root.
- The file contains `compilerOptions.baseUrl = "."` and `paths` for all libs declared in `package.json > sublib.libs` (relative paths under `vendor/`).
- Add one line to your project `tsconfig.json`:

```
{
  "extends": "./tsconfig.sublib.json"
}
```

- After this, `tsc` and your IDE resolve imports like `egak.js` / `ugocas.js` directly to `vendor/*` sources.

 

## CLI (Bun)

- Global link (dev):
  - `bun link --global` in this directory
  - Then use `sublib <add|pull|push> <name>`
 - Manual regenerate:
   - `sublib gen` to (re)generate `./tsconfig.sublib.json` after editing `package.json > sublib.libs`

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

## Basic Principles

- Monorepo-first: Develop sub-libraries inside your app repo under `vendor/<lib>` for fast local iteration (HMR via the Vite plugin).
- Clean extraction: Publish each library out of the monorepo with `git subtree` so only the library code goes upstream.
- History policy: Use `--squash` when pulling upstream to avoid importing upstream’s full history into the app repo. Your local edits under `vendor/<lib>` live as normal app commits until pushed upstream.
- No app history (option): `.gitignore vendor/*` and clone each library as its own Git repo into `vendor/`. The Vite plugin still works; commits live only in each library repo.
- Import by package name: e.g. `@kesompochy/sublib/vite`. The plugin auto-aliases to `vendor/*` when present; otherwise falls back to the package source.
