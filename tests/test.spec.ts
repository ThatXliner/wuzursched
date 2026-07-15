import { expect, test, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';
import { pinSelectedItem } from '../src/lib/classPicker';

const env = dotenv.config().parsed ?? {};
const supabaseUrl = env.PUBLIC_SUPABASE_URL!;
const supabaseKey = env.PUBLIC_SUPABASE_ANON_KEY!;
const periods = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;

async function insertTestSchedule(request: APIRequestContext, room: string, student: string) {
	const headers = {
		apikey: supabaseKey,
		Authorization: `Bearer ${supabaseKey}`,
		Prefer: 'return=representation'
	};
	const classesResponse = await request.post(`${supabaseUrl}/rest/v1/classes`, {
		headers,
		data: periods.map((period) => ({
			name: `class ${period}`,
			teacher_first: 'test',
			teacher_last: period,
			room
		}))
	});
	expect(classesResponse.ok()).toBe(true);
	const classes = (await classesResponse.json()) as { id: string }[];

	const schedule = Object.fromEntries(periods.map((period, index) => [period, classes[index].id]));
	const scheduleResponse = await request.post(`${supabaseUrl}/rest/v1/schedules`, {
		headers,
		data: { room, student, ...schedule }
	});
	expect(scheduleResponse.ok()).toBe(true);

	return { room, student, ...schedule };
}

const entries = ['algebra', 'biology', 'chemistry'].map((id, rank) => ({
	item: { id },
	rank
}));

test.describe('class picker ordering', () => {
	test('pins the selected class first in the empty-query class list', () => {
		const ordered = pinSelectedItem(entries, 'chemistry');

		expect(ordered.map(({ item }) => item.id)).toEqual(['chemistry', 'algebra', 'biology']);
	});

	test('pins a matching selected class without changing the ranking of other search results', () => {
		const searchResults = [entries[1], entries[2], entries[0]];
		const ordered = pinSelectedItem(searchResults, 'algebra');

		expect(ordered).toEqual([entries[0], entries[1], entries[2]]);
		expect(ordered.filter(({ item }) => item.id === 'algebra')).toHaveLength(1);
	});

	test('does not add the selected class when it does not match the search', () => {
		const searchResults = [entries[1], entries[2]];

		expect(pinSelectedItem(searchResults, 'algebra')).toBe(searchResults);
	});
});

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('Wuzursched');
});

for (const onlyMatching of [false, true]) {
	test(`resetting identity reopens the form when matching is ${onlyMatching ? 'on' : 'off'}`, async ({
		page,
		request
	}) => {
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => pageErrors.push(error));

		await page.goto('/create');
		const room = new URL(page.url()).pathname.split('/').at(-1)!;
		const student = `Reset Test ${crypto.randomUUID()}`;
		const schedule = await insertTestSchedule(request, room, student);

		await page.evaluate(
			({ room, student, schedule }) => {
				window.localStorage.setItem(room, JSON.stringify({ name: student, schedule }));
			},
			{ room, student, schedule }
		);
		await page.reload();

		const matchingToggle = page.getByRole('checkbox', { name: 'Only show matching' });
		await expect(matchingToggle).toBeEnabled();
		if (onlyMatching) await matchingToggle.check();

		await page.getByRole('button', { name: 'Reset who you are' }).click();

		await expect(page.getByRole('heading', { name: 'But first...' })).toBeVisible();
		await expect(matchingToggle).not.toBeChecked();
		await expect(matchingToggle).toBeDisabled();
		expect(await page.evaluate((room) => window.localStorage.getItem(room), room)).toBeNull();
		expect(pageErrors).toEqual([]);
	});
}

test('footer links to the legal documents', async ({ page }) => {
	await page.goto('/');

	await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Terms' })).toHaveAttribute(
		'href',
		'/terms'
	);
	await expect(
		page.getByRole('contentinfo').getByRole('link', { name: 'Privacy' })
	).toHaveAttribute('href', '/privacy');
});

test('terms of service is available at a durable route', async ({ page }) => {
	await page.goto('/terms');

	await expect(page).toHaveTitle(/Terms of Service/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms of Service');
	await expect(page.getByText('Effective July 14, 2026')).toBeVisible();
	await expect(page.getByRole('link', { name: 'thatxliner@gmail.com' })).toHaveAttribute(
		'href',
		'mailto:thatxliner@gmail.com'
	);
});

test('privacy policy describes room visibility and deletion', async ({ page }) => {
	await page.goto('/privacy');

	await expect(page).toHaveTitle(/Privacy Policy/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy Policy');
	await expect(page.getByText('Effective July 14, 2026')).toBeVisible();
	await expect(page.getByText(/Anyone who has a room link may be able to read/)).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Retention and deletion' })).toBeVisible();
});
