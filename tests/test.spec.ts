import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/supabase';

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

	let resolveRealtimeUpdate: (student: string) => void = () => {};
	const realtimeUpdate = new Promise<string>((resolve) => {
		resolveRealtimeUpdate = resolve;
	});
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
					resolveRealtimeUpdate(payload.new.student as string);
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
	await editDialog.getByRole('button', { name: 'Save changes' }).click();

	await expect(page.getByText('Your schedule was updated')).toBeVisible();
	await expect(
		Promise.race([
			realtimeUpdate,
			new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Timed out waiting for realtime update')), 10_000)
			)
		])
	).resolves.toBe(editedName);
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
