import { expect, test } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const src = join(process.cwd(), 'src');
const roomRoute = join(src, 'routes', 'room', '[room=uuid]');
const routeLocalComponents = join(roomRoute, 'components');

async function sourceFiles(directory: string): Promise<string[]> {
	const entries = await readdir(directory, { withFileTypes: true });
	return (
		await Promise.all(
			entries.map((entry) => {
				const path = join(directory, entry.name);
				return entry.isDirectory() ? sourceFiles(path) : [path];
			})
		)
	).flat();
}

test('schedule entry components stay local to the room route', async () => {
	const files = (await sourceFiles(src)).filter((file) =>
		['.js', '.ts', '.svelte'].includes(extname(file))
	);
	const importers: string[] = [];

	for (const file of files) {
		const source = await readFile(file, 'utf8');
		if (/(?:components\/|\.\/)(?:InfoInput|ClassPicker|ScheduleImporter)\.svelte/.test(source)) {
			importers.push(file);
		}
	}

	expect(importers.length).toBeGreaterThan(0);
	expect(importers.map((file) => relative(src, file))).toEqual(
		expect.arrayContaining([
			'routes/room/[room=uuid]/+page.svelte',
			'routes/room/[room=uuid]/components/InfoInput.svelte'
		])
	);
	expect(importers.every((file) => file.startsWith(roomRoute))).toBe(true);
	await expect(readFile(join(routeLocalComponents, 'InfoInput.svelte'), 'utf8')).resolves.toContain(
		"from '$lib/schedule'"
	);
	await expect(
		readFile(join(routeLocalComponents, 'ScheduleImporter.svelte'), 'utf8')
	).resolves.toContain("from '$lib/schedule'");
});
