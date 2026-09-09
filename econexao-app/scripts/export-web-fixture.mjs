import { spawnSync } from 'node:child_process';

const result = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['expo', 'export', '-p', 'web', '--clear'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: 'http://127.0.0.1:8082/api/v1',
    EXPO_PUBLIC_SUPABASE_URL: 'https://fixture.supabase.co',
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_fixture_only',
  },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

process.exit(result.status ?? 1);
