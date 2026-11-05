import { defineConfig, devices } from '@playwright/test';

const requiredPublicEnv = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
const supabaseEnv = Object.fromEntries(requiredPublicEnv.map(name => [name, process.env[name] ?? (name === 'NEXT_PUBLIC_SUPABASE_URL' ? 'https://preview-auth-test.supabase.co' : 'test-public-anon-key')]));

export default defineConfig({
  globalSetup: process.env.RUN_OPENAI_INTEGRATION ? undefined : './tests/e2e/provider-mock.ts',
  testDir: './tests/e2e',
  testIgnore: process.env.RUN_INTEGRATION ? undefined : '**/*.integration.spec.ts',
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4385', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  // A freshly built, dedicated server prevents a different checkout on 4385 from being reused.
  webServer: {
    command: 'pnpm start --hostname 127.0.0.1 -p 4385',
    url: 'http://127.0.0.1:4385',
    reuseExistingServer: false,
    timeout: 120000,
    env: { ...supabaseEnv, ...(process.env.RUN_OPENAI_INTEGRATION ? {} : {OPENAI_API_KEY: 'normal-suite-local-only', OPENAI_BASE_URL: 'http://127.0.0.1:4386/v1'}) },
  },
  // Mobile coverage uses Chromium device emulation; WebKit 2370 is installed but host libraries are unavailable.
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], browserName: 'chromium' } }],
});
