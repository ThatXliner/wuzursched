import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import process from 'node:process';

export const ROOM_ID = '10000000-0000-4000-8000-000000000013';

export const classes = [
	['20000000-0000-4000-8000-000000000001', 'algebra', 'ava', 'adams'],
	['20000000-0000-4000-8000-000000000002', 'biology', 'ben', 'baker'],
	['20000000-0000-4000-8000-000000000003', 'chemistry', 'cara', 'cole'],
	['20000000-0000-4000-8000-000000000004', 'drama', 'dan', 'diaz'],
	['20000000-0000-4000-8000-000000000005', 'english', 'ella', 'evans'],
	['20000000-0000-4000-8000-000000000006', 'french', 'finn', 'frost'],
	['20000000-0000-4000-8000-000000000007', 'geometry', 'gia', 'green'],
	['20000000-0000-4000-8000-000000000008', 'history', 'hank', 'hall']
] as const;

const periods = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;

export type FixtureSchedule = Record<(typeof periods)[number], string> & {
	room: string;
	student: string;
};

export function schedule(student: string, order = [0, 1, 2, 3, 4, 5, 6, 7]): FixtureSchedule {
	return Object.fromEntries([
		['room', ROOM_ID],
		['student', student],
		...periods.map((period, index) => [period, classes[order[index]][0]])
	]) as FixtureSchedule;
}

export function adminClient(): SupabaseClient {
	const url = process.env.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceRoleKey) {
		throw new Error(
			'Missing local Supabase credentials. Run `supabase status --output env | node convert_env.js > .env`.'
		);
	}
	return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

async function expectDatabaseSuccess(
	operation: PromiseLike<{ error: { message: string } | null }>,
	label: string
) {
	const { error } = await operation;
	if (error) throw new Error(`${label}: ${error.message}`);
}

export async function resetRoom({ withSchedules = true } = {}) {
	const admin = adminClient();
	await expectDatabaseSuccess(
		admin.from('schedules').delete().eq('room', ROOM_ID),
		'delete schedules'
	);
	await expectDatabaseSuccess(admin.from('classes').delete().eq('room', ROOM_ID), 'delete classes');
	await expectDatabaseSuccess(admin.from('rooms').delete().eq('id', ROOM_ID), 'delete room');
	await expectDatabaseSuccess(admin.from('rooms').insert({ id: ROOM_ID }), 'insert room');
	await expectDatabaseSuccess(
		admin.from('classes').insert(
			classes.map(([id, name, teacher_first, teacher_last]) => ({
				id,
				name,
				teacher_first,
				teacher_last,
				room: ROOM_ID
			}))
		),
		'insert classes'
	);
	if (withSchedules) {
		await expectDatabaseSuccess(
			admin
				.from('schedules')
				.insert([
					schedule('Alice'),
					schedule('Bob', [0, 2, 3, 4, 5, 6, 7, 1]),
					schedule('Cara', [1, 2, 3, 4, 5, 6, 7, 0])
				]),
			'insert schedules'
		);
	}
	return admin;
}

export async function removeRoom() {
	const admin = adminClient();
	await admin.from('schedules').delete().eq('room', ROOM_ID);
	await admin.from('classes').delete().eq('room', ROOM_ID);
	await admin.from('rooms').delete().eq('id', ROOM_ID);
}
