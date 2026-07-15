import { expect, test, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';
import { pinSelectedItem } from '../src/lib/classPicker';

declare const process: { env: Record<string, string | undefined> };

const periods = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;

async function insertTestSchedule(page: Page, room: string, student: string) {
	const supabase = createClient<Database>(
		process.env.PUBLIC_SUPABASE_URL!,
		process.env.PUBLIC_SUPABASE_ANON_KEY!,
		{ auth: { persistSession: false } }
	);
	const seedResult = await page.evaluate(
		async ({ room, classList }) => {
			const form = new FormData();
			form.set('class_list', classList);
			const response = await fetch(`/room/${room}?/seed`, { method: 'POST', body: form });
			return { ok: response.ok, body: await response.text() };
		},
		{
			room,
			classList: periods.map((period) => `class ${period},Dr.,${period}`).join('\n')
		}
	);
	expect(seedResult.ok, seedResult.body).toBe(true);

	let classes: { id: string; name: string }[] = [];
	await expect
		.poll(async () => {
			const result = await supabase.from('classes').select('id,name').eq('room', room);
			if (result.error) throw result.error;
			classes = result.data;
			return classes.length;
		})
		.toBe(periods.length);

	const schedule = Object.fromEntries(
		periods.map((period) => [period, classes.find(({ name }) => name === `class ${period}`)!.id])
	) as Record<(typeof periods)[number], string>;
	const { data: editToken, error } = await supabase.rpc('create_schedule', {
		p_room: room,
		p_student: student,
		p_period_1a: schedule['1a'],
		p_period_2a: schedule['2a'],
		p_period_3a: schedule['3a'],
		p_period_4a: schedule['4a'],
		p_period_1b: schedule['1b'],
		p_period_2b: schedule['2b'],
		p_period_3b: schedule['3b'],
		p_period_4b: schedule['4b']
	});
	expect(error).toBeNull();
	expect(editToken).toMatch(/^[a-f0-9]{64}$/);

	return { schedule: { room, student, ...schedule }, editToken: editToken! };
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
test('only the edit-key holder can update a schedule and everyone receives the update', async ({
	page
}) => {
	const supabaseUrl = process.env.PUBLIC_SUPABASE_URL!;
	const anonKey = process.env.PUBLIC_SUPABASE_ANON_KEY!;
	const supabase = createClient<Database>(supabaseUrl, anonKey, {
		auth: { persistSession: false }
	});
	const room = crypto.randomUUID();
	const unique = room.slice(0, 8);

	expect((await supabase.from('rooms').insert({ id: room })).error).toBeNull();
	const { data: classes, error: classError } = await supabase
		.from('classes')
		.insert(
			Array.from({ length: 8 }, (_, index) => ({
				name: `class-${unique}-${index}`,
				teacher_first: 'test',
				teacher_last: `teacher-${index}`,
				room
			}))
		)
		.select();
	expect(classError).toBeNull();
	expect(classes).toHaveLength(8);

	const originalName = `Student ${unique}`;
	const editedName = `Edited ${unique}`;
	const schedule = {
		'1a': classes![0].id,
		'2a': classes![1].id,
		'3a': classes![2].id,
		'4a': classes![3].id,
		'1b': classes![4].id,
		'2b': classes![5].id,
		'3b': classes![6].id,
		'4b': classes![7].id
	};
	const rpcSchedule = {
		p_room: room,
		p_student: originalName,
		p_period_1a: schedule['1a'],
		p_period_2a: schedule['2a'],
		p_period_3a: schedule['3a'],
		p_period_4a: schedule['4a'],
		p_period_1b: schedule['1b'],
		p_period_2b: schedule['2b'],
		p_period_3b: schedule['3b'],
		p_period_4b: schedule['4b']
	};
	const { data: editToken, error: createError } = await supabase.rpc(
		'create_schedule',
		rpcSchedule
	);
	expect(createError).toBeNull();
	expect(editToken).toMatch(/^[a-f0-9]{64}$/);

	const directUpdate = await supabase
		.from('schedules')
		.update({ student: 'Anonymous attacker' })
		.eq('room', room)
		.eq('student', originalName);
	expect(directUpdate.error).not.toBeNull();

	const wrongKeyUpdate = await supabase.rpc('update_schedule', {
		...rpcSchedule,
		p_current_student: originalName,
		p_edit_token: 'not-the-edit-key',
		p_student: 'Anonymous attacker'
	});
	expect(wrongKeyUpdate.error?.message).toContain('Invalid schedule edit key');

	const realtimeStudents: string[] = [];
	const realtimeReady = new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(
			() => reject(new Error('Timed out subscribing to realtime updates')),
			10_000
		);
		supabase
			.channel(`schedule-update-${unique}`)
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'schedules', filter: `room=eq.${room}` },
				(payload) => {
					realtimeStudents.push(payload.new.student as string);
				}
			)
			.subscribe((status) => {
				if (status === 'SUBSCRIBED') {
					clearTimeout(timeout);
					resolve();
				}
			});
	});
	await realtimeReady;
	await expect
		.poll(
			async () => {
				const { error } = await supabase.rpc('update_schedule', {
					...rpcSchedule,
					p_current_student: originalName,
					p_edit_token: editToken!
				});
				if (error) throw error;
				return realtimeStudents.includes(originalName);
			},
			{ message: 'Realtime CDC should become ready', timeout: 10_000, intervals: [500, 1_000] }
		)
		.toBe(true);
	realtimeStudents.length = 0;

	await page.addInitScript(
		({ storageKey, identity }) => localStorage.setItem(storageKey, JSON.stringify(identity)),
		{
			storageKey: room,
			identity: {
				name: originalName,
				schedule: { ...schedule, room, student: originalName },
				editToken
			}
		}
	);
	await page.goto(`/room/${room}`);
	await page.getByRole('button', { name: 'Edit my schedule' }).click();
	const editDialog = page.getByRole('dialog').filter({ hasText: 'Edit your schedule' });
	await editDialog.getByRole('textbox', { name: 'Name' }).fill(editedName);
	await editDialog
		.getByRole('checkbox', { name: 'I reviewed this schedule and confirm it is ready to submit.' })
		.check();
	await editDialog.getByRole('button', { name: 'Save changes' }).click();

	await expect(page.getByText('Your schedule was updated')).toBeVisible();
	await expect
		.poll(() => realtimeStudents.includes(editedName), {
			message: 'Everyone in the room should receive the edited schedule',
			timeout: 10_000
		})
		.toBe(true);
	const { data: updated } = await supabase
		.from('schedules')
		.select('*')
		.eq('room', room)
		.eq('student', editedName)
		.single();
	expect(updated?.student).toBe(editedName);

	const { data: replacementToken, error: rotateError } = await supabase.rpc(
		'rotate_schedule_edit_capability',
		{ p_room: room, p_student: editedName, p_edit_token: editToken! }
	);
	expect(rotateError).toBeNull();
	expect(replacementToken).toMatch(/^[a-f0-9]{64}$/);
	const { data: oldKeyValid } = await supabase.rpc('verify_schedule_edit_capability', {
		p_room: room,
		p_student: editedName,
		p_edit_token: editToken!
	});
	const { data: newKeyValid } = await supabase.rpc('verify_schedule_edit_capability', {
		p_room: room,
		p_student: editedName,
		p_edit_token: replacementToken!
	});
	expect(oldKeyValid).toBe(false);
	expect(newKeyValid).toBe(true);

	await supabase.removeAllChannels();
});

for (const onlyMatching of [false, true]) {
	test(`resetting identity reopens the form when matching is ${onlyMatching ? 'on' : 'off'}`, async ({
		page
	}) => {
		const pageErrors: Error[] = [];
		page.on('pageerror', (error) => pageErrors.push(error));

		await page.goto('/create');
		const room = new URL(page.url()).pathname.split('/').at(-1)!;
		const student = `Reset Test ${crypto.randomUUID()}`;
		const { schedule, editToken } = await insertTestSchedule(page, room, student);

		await page.evaluate(
			({ room, student, schedule, editToken }) => {
				window.localStorage.setItem(room, JSON.stringify({ name: student, schedule, editToken }));
			},
			{ room, student, schedule, editToken }
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
