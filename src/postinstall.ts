import { generateForConsumer } from './tsconfig_paths';

(() => {
  try {
    const consumerRoot = process.env.INIT_CWD || process.cwd();
    const outPath = generateForConsumer(consumerRoot);
    console.log(`[sublib] generated ${outPath}`);
  } catch (e: any) {
    console.warn('[sublib] postinstall failed:', e?.message || e);
  }
})();
