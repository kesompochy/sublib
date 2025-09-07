import fs from 'node:fs';
import path from 'node:path';

type SublibConfig = { root: string; libs: Record<string, { url: string; branch?: string }> };

export const readSublibConfig = (consumerRoot: string): SublibConfig => {
  const pkgPath = path.resolve(consumerRoot, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const conf = (pkg.sublib || { root: 'vendor', libs: {} }) as SublibConfig;
  return { root: conf.root || 'vendor', libs: conf.libs || {} };
};

export const buildPaths = (consumerRoot: string, cfg: SublibConfig): Record<string, string[]> => {
  const root = cfg.root || 'vendor';
  const libs = Object.keys(cfg.libs || {});
  const paths: Record<string, string[]> = {};
  for (const name of libs) {
    const dir = path.resolve(consumerRoot, root, name);
    if (!fs.existsSync(dir)) continue;
    const src = fs.existsSync(path.join(dir, 'src')) ? path.join(dir, 'src') : dir;
    const entries = [
      path.join(src, 'index.ts'),
      path.join(src, 'index.tsx'),
      path.join(src, 'index.js'),
      src,
    ].filter((p) => fs.existsSync(p) || p === src);
    paths[name] = entries;
    paths[`${name}/*`] = [path.join(src, '*')];
  }
  return paths;
};

export const generateForConsumer = (consumerRoot: string): string => {
  const cfg = readSublibConfig(consumerRoot);
  const paths = buildPaths(consumerRoot, cfg);
  const out = {
    compilerOptions: {
      baseUrl: consumerRoot,
      preserveSymlinks: true,
      paths,
    },
  };
  const outPath = path.join(consumerRoot, 'tsconfig.sublib.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  return outPath;
};
