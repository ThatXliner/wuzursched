import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('local environment conversion exposes only browser-safe Supabase values', () => {
	const input = [
		'API_URL="http://127.0.0.1:54321"',
		'ANON_KEY="anonymous"',
		'SERVICE_ROLE_KEY="must-not-be-public"',
		'DB_URL="postgresql://postgres:secret@127.0.0.1/postgres"'
	].join('\n');
	const result = spawnSync(process.execPath, ['convert_env.js'], {
		cwd: root,
		input,
		encoding: 'utf8'
	});

	assert.equal(result.status, 0, result.stderr);
	assert.equal(
		result.stdout,
		'PUBLIC_SUPABASE_URL=http://127.0.0.1:54321\nPUBLIC_SUPABASE_ANON_KEY=anonymous\n'
	);
});
