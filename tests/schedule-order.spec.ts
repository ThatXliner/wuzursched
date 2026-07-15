import { expect, test } from '@playwright/test';
import type { Schedule } from '../src/lib/InfoInput';
import type { You } from '../src/routes/room/[room=uuid]/ViewSchedules';
import {
	isCurrentSchedule,
	prioritizeCurrentSchedule
} from '../src/routes/room/[room=uuid]/schedule-order';

const makeSchedule = (student: string): Schedule => ({
	student,
	room: 'room',
	'1a': '1a',
	'1b': '1b',
	'2a': '2a',
	'2b': '2b',
	'3a': '3a',
	'3b': '3b',
	'4a': '4a',
	'4b': '4b'
});

const ada = makeSchedule('Ada');
const grace = makeSchedule('Grace');
const linus = makeSchedule('Linus');
const currentUser: You = { name: 'Grace', schedule: grace };

test('moves the current user first without mutating the Supabase result', () => {
	const schedules = [ada, grace, linus];
	const ordered = prioritizeCurrentSchedule(schedules, currentUser);

	expect(ordered).toEqual([grace, ada, linus]);
	expect(schedules).toEqual([ada, grace, linus]);
	expect(ordered).not.toBe(schedules);
});

test('preserves every other schedule order after search or matching filters', () => {
	const filtered = [linus, ada, grace];

	expect(prioritizeCurrentSchedule(filtered, currentUser)).toEqual([grace, linus, ada]);
});

test('keeps the current user first after realtime inserts', () => {
	const schedules = [ada, grace];
	const realtimeSchedules = [...schedules, linus];

	expect(prioritizeCurrentSchedule(realtimeSchedules, currentUser)).toEqual([grace, ada, linus]);
});

test('restores source order when identity is reset or unresolved', () => {
	const schedules = [ada, grace, linus];

	expect(prioritizeCurrentSchedule(schedules, null)).toEqual(schedules);
	expect(prioritizeCurrentSchedule(schedules, 'tentative')).toEqual(schedules);
	expect(prioritizeCurrentSchedule(schedules, undefined)).toEqual(schedules);
});

test('uses the persisted student identity for current-user treatment', () => {
	expect(isCurrentSchedule(grace, currentUser)).toBe(true);
	expect(isCurrentSchedule(ada, currentUser)).toBe(false);
});
