import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const docs = ['README.md', 'docs/ARCHITECTURE.md', 'docs/DEVELOPMENT.md'];

async function text(relativePath) {
	return readFile(path.join(root, relativePath), 'utf8');
}

test('README links to the contributor guides', async () => {
	const readme = await text('README.md');
	assert.match(readme, /\.\/docs\/ARCHITECTURE\.md/);
	assert.match(readme, /\.\/docs\/DEVELOPMENT\.md/);
});

test('documented package commands exist', async () => {
	const packageJson = JSON.parse(await text('package.json'));
	const markdown = (await Promise.all(docs.map(text))).join('\n');
	const documentedScripts = [...markdown.matchAll(/`pnpm run ([\w:-]+)`/g)].map(
		([, script]) => script
	);

	for (const script of documentedScripts) {
		assert.ok(packageJson.scripts[script], `documented script "${script}" is missing`);
	}
});

test('local Markdown links resolve', async () => {
	for (const document of docs) {
		const markdown = await text(document);
		const links = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map(([, link]) => link);

		for (const link of links) {
			if (/^(?:https?:|#)/.test(link)) continue;
			const [target] = link.split('#');
			await assert.doesNotReject(
				readFile(path.resolve(root, path.dirname(document), target)),
				`${document} links to missing path ${target}`
			);
		}
	}
});

test('architecture guide source paths exist', async () => {
	const architecture = await text('docs/ARCHITECTURE.md');
	const sourcePaths = [...architecture.matchAll(/`([^`]+)`/g)]
		.map(([, sourcePath]) => sourcePath)
		.filter((sourcePath) => /^(?:src|supabase)\//.test(sourcePath))
		.map((sourcePath) => sourcePath.replace(/\/$/, ''));

	for (const sourcePath of sourcePaths) {
		await assert.doesNotReject(
			stat(path.join(root, sourcePath)),
			`architecture guide references missing source path ${sourcePath}`
		);
	}
});
