import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';
import { readFileSync, existsSync } from 'fs';
import { platform } from 'os';

const isWindows = platform() === 'win32';

if (isWindows) {
  console.warn(
    '\n⚠️  Skipping e2e tests on Windows (SQLite/workerd incompatibility)\n' +
      '   These tests run in CI on Linux.\n'
  );
}

function getFiaAccessKey(): string {
  if (process.env.FIA_ACCESS_KEY) return process.env.FIA_ACCESS_KEY;
  if (existsSync('.dev.vars')) {
    const content = readFileSync('.dev.vars', 'utf-8');
    const match = content.match(/^FIA_ACCESS_KEY=(.+)$/m);
    if (match) {
      process.env.FIA_ACCESS_KEY = match[1];
      return match[1];
    }
  }
  return '';
}

const fiaAccessKey = getFiaAccessKey();

export default defineWorkersConfig({
  test: {
    globals: true,
    poolOptions: {
      workers: {
        wrangler: { configPath: './wrangler.toml' },
        miniflare: {
          bindings: {
            ENVIRONMENT: 'test',
            FIA_API_URL: 'https://api.fiaproject.org/graphql',
            FIA_AUTH_URL: 'https://auth.fiaproject.org/token',
            FIA_ACCESS_KEY: fiaAccessKey,
          },
        },
      },
    },
    include: ['tests/**/*.test.ts'],
    exclude: isWindows ? ['tests/e2e/**'] : [],
    testTimeout: 30000,
  },
});
