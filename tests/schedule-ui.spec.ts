import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Schedule } from '../src/lib/schedule';

const room = crypto.randomUUID();
const prefix = room.slice(0, 8);
let schedules: Schedule[];

test.beforeAll(async () => {
	const environment = (
		globalThis as typeof globalThis & { process?: { env: Record<string, string | undefined> } }
	).process?.env;
	const url = environment?.PUBLIC_SUPABASE_URL;
	const key = environment?.SUPABASE_SERVICE_ROLE_KEY ?? environment?.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !key) throw new Error('Local Supabase environment is required for schedule UI tests');

	const supabase = createClient(url, key);
	const { error: roomError } = await supabase.from('rooms').insert({ id: room });
	if (roomError) throw roomError;

	const { data: classes, error: classError } = await supabase
		.from('classes')
		.insert(
			Array.from({ length: 16 }, (_, index) => ({
				name: `fixture class ${index + 1}`,
				teacher_first: 'casey',
				teacher_last: `teacher${index + 1}`,
				room
			}))
		)
		.select();
	if (classError || !classes) throw classError ?? new Error('Class fixture creation failed');

	schedules = Array.from({ length: 120 }, (_, index) => {
		const offset = index % 2 === 0 ? 0 : 8;
		return {
			room,
			student:
				index === 119
					? `${prefix} A student with an exceptionally long name that must stay contained`
					: `${prefix} Student ${String(index + 1).padStart(3, '0')}`,
			'1a': classes[offset].id,
			'2a': classes[offset + 1].id,
			'3a': classes[offset + 2].id,
			'4a': classes[offset + 3].id,
			'1b': classes[offset + 4].id,
			'2b': classes[offset + 5].id,
			'3b': classes[offset + 6].id,
			'4b': classes[offset + 7].id
		};
	});
	const { error: scheduleError } = await supabase.from('schedules').insert(schedules);
	if (scheduleError) throw scheduleError;
});

async function identifyAsFirstStudent(page: Page) {
	await page.addInitScript(({ room, you }) => localStorage.setItem(room, JSON.stringify(you)), {
		room,
		you: { name: schedules[0].student, schedule: schedules[0] }
	});
}

test('large rooms use a compact overview and lazy detail loading', async ({ page }) => {
	await identifyAsFirstStudent(page);
	let detailRequests = 0;
	page.on('request', (request) => {
		if (request.url().includes('/rest/v1/classes?select=*&id=eq.')) detailRequests += 1;
	});

	await page.goto(`/room/${room}`);
	const schedulesPanel = page.getByRole('tabpanel', { name: 'All Schedules' });
	await expect(page.getByRole('heading', { name: 'People & matches' })).toBeVisible();
	await expect(schedulesPanel.getByLabel('People').getByRole('button')).toHaveCount(120);
	await expect(schedulesPanel.getByRole('heading', { name: 'Select a person' })).toBeVisible();
	expect(detailRequests).toBe(0);

	const firstPerson = schedulesPanel.getByLabel('People').getByRole('button').first();
	await firstPerson.focus();
	await page.keyboard.press('Enter');
	await expect(
		page.getByRole('heading', { name: `${schedules[0].student}'s schedule` })
	).toBeVisible();
	await expect(page.getByRole('region', { name: 'Schedule details' })).toBeVisible();
	await expect(
		page.getByRole('region', { name: 'Schedule details' }).locator('.bg-success')
	).toHaveCount(8);
	expect(detailRequests).toBeGreaterThan(0);

	await page.getByRole('checkbox', { name: 'Only show matching' }).check();
	await expect(schedulesPanel.getByLabel('People').getByRole('button')).toHaveCount(60);
	await page.getByRole('checkbox', { name: 'Only show matching' }).uncheck();
	await page.getByPlaceholder('Search for a student').fill('exceptionally long name');
	await expect(schedulesPanel.getByLabel('People').getByRole('button')).toHaveCount(1);

	await page.getByRole('tab', { name: 'Filter', exact: true }).click();
	const filterPanel = page.getByRole('tabpanel', { name: 'Filter', exact: true });
	await filterPanel.getByRole('button', { name: /Fixture class 1/i }).click();
	await expect(filterPanel.getByLabel('People').getByRole('button')).toHaveCount(59);
});

test('the comparison remains contained on a mobile viewport', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await identifyAsFirstStudent(page);
	await page.goto(`/room/${room}`);

	await page.getByLabel('People').getByRole('button').last().click();
	await expect(page.getByRole('region', { name: 'Schedule details' })).toBeVisible();
	const dimensions = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		viewportWidth: window.innerWidth
	}));
	expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.viewportWidth);
});
