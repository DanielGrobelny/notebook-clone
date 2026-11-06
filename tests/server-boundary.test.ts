import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { expect, it } from 'vitest';
const root = process.cwd();
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? files(path) : /\.tsx?$/.test(path) ? [path] : [];
  });
}
const sources = files(resolve(root, 'app')).concat(files(resolve(root, 'lib')));
const contents = new Map(sources.map((file) => [file, readFileSync(file, 'utf8')]));
function visit(file: string, seen = new Set<string>()) {
  if (seen.has(file)) return;
  seen.add(file);
  const source = contents.get(file) ?? '';
  expect(source, file).not.toMatch(
    /import ['"]server-only['"]|SUPABASE_SERVICE_ROLE_KEY|OPENAI_API_KEY/,
  );
  for (const match of source.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)) {
    const base = resolve(dirname(file), match[1]);
    const target = [base, base + '.ts', base + '.tsx', resolve(base, 'index.ts')].find(
      (candidate) => contents.has(candidate),
    );
    if (target && extname(target)) visit(target, seen);
  }
}
it('client entry import graphs cannot reach privileged configuration', () => {
  for (const [file, source] of contents) if (/^['"]use client['"]/.test(source)) visit(file);
});
it('both database capabilities and session resolution have explicit server boundaries', () => {
  for (const path of ['lib/supabase/server.ts', 'lib/supabase/admin.ts', 'lib/visitor-session.ts'])
    expect(contents.get(resolve(root, path))).toMatch(/^import 'server-only';/);
  expect(contents.get(resolve(root, 'lib/supabase/server.ts'))).not.toContain(
    'SUPABASE_SERVICE_ROLE_KEY',
  );
});
