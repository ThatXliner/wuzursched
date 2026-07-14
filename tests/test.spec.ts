import { expect, test, type APIRequestContext } from '@playwright/test';
import dotenv from 'dotenv';

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
