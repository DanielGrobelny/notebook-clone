import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, basename } from 'node:path';
// Run only in an isolated checkout with no active build or dev server.
const directory = await mkdtemp(join(process.cwd(), 'app', 'boundary-negative-'));
try {
  await writeFile(
    join(directory, 'page.tsx'),
    "'use client';\nimport { adminClient } from '../../lib/supabase/admin';\nexport default function Probe(){ return <button onClick={() => adminClient()}>Probe</button>; }\n",
  );
  const result = spawnSync(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'build', '--webpack'],
    { encoding: 'utf8' },
  );
  const output = (result.stdout ?? '') + (result.stderr ?? '');
  if (result.status === 0 || !output.includes('server-only'))
    throw Error('Client import was not rejected by the server-only boundary');
  console.log('PASS: production compiler rejects privileged client import');
} finally {
  await rm(directory, { recursive: true });
  await rm(join(process.cwd(), '.next/types/app', basename(directory)), {
    recursive: true,
    force: true,
  });
  const generated = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'typegen'], {
    stdio: 'inherit',
  });
  if (generated.status !== 0) throw Error('Could not regenerate normal route types');
  // The negative build is disposable; regenerate a normal build before serving.
}
