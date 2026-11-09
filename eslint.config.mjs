import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  // Existing ungenerated Supabase rows and test doubles remain visible debt.
  // Keep diagnostics enabled while introducing lint without a schema rewrite.
  { rules: { '@typescript-eslint/no-explicit-any': 'warn' } },
  {
    files: ['app/page.tsx', 'app/persistence.tsx', 'app/sources.tsx', 'app/studio.tsx'],
    // These components predate React Compiler; do not claim compiler readiness.
    rules: { 'react-hooks/set-state-in-effect': 'warn' },
  },
  globalIgnores([
    '.next/**',
    'test-results/**',
    'playwright-report/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
]);
