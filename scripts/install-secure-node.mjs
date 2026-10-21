import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';

const archives = {
	arm64: '33c37be234ba8bee041961047b19160f4d7d0f164e8e246f78bdd10feff148b3',
	x64: 'eb6728e77c576a35162c122c45ccadf224d89ff00abc8dae46cc2897c6002d7c'
};
if (process.platform !== 'linux' || !archives[process.arch]) {
	throw new Error(`No verified Node bootstrap for ${process.platform}/${process.arch}`);
}
const destination = process.argv[2] || '/tmp/wuzursched-secure-node';
const archive = join(destination, 'node.tar.gz');
const response = await fetch(
	`https://nodejs.org/dist/v24.22.1/node-v24.22.1-linux-${process.arch}.tar.gz`
);
if (!response.ok) throw new Error(`Node download failed: HTTP ${response.status}`);
const data = Buffer.from(await response.arrayBuffer());
// The pinned digest authenticates this bootstrap even before the host runtime is patched.
if (createHash('sha256').update(data).digest('hex') !== archives[process.arch]) {
	throw new Error('Node archive SHA256 mismatch');
}
await mkdir(destination, { recursive: true });
await writeFile(archive, data);
execFileSync('tar', ['-xzf', archive, '--strip-components=1', '-C', destination]);
await rm(archive);
const executable = join(destination, 'bin', 'node');
if (execFileSync(executable, ['--version'], { encoding: 'utf8' }).trim() !== 'v24.22.1') {
	throw new Error('Unexpected Node version');
}
console.log(`Verified Node 24.22.1 installed at ${executable}`);
