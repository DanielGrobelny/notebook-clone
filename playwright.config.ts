import { defineConfig, devices } from '@playwright/test';

const requiredPublicEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
const supabaseEnv = Object.fromEntries(requiredPublicEnv.map(name => [name, process.env[name] ?? '']));

export default defineConfig({
  globalSetup: './tests/e2e/provider-mock.ts',
  testDir: './tests/e2e',
  testIgnore: process.env.RUN_INTEGRATION ? undefined : '**/*.integration.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4285', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  // A freshly built, dedicated server prevents a different checkout on 4285 from being reused.
  webServer: {
    command: 'pnpm start -p 4285',
    url: 'http://127.0.0.1:4285',
    reuseExistingServer: false,
    timeout: 120000,
    env: { ...supabaseEnv, OPENAI_API_KEY: 'normal-suite-local-only', OPENAI_BASE_URL: 'http://127.0.0.1:4286/v1' },
  },
  // Mobile coverage uses Chromium device emulation; WebKit 2370 is installed but host libraries are unavailable.
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
});
