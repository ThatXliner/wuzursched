import { expect, test } from '@playwright/test';
import { engineerSchedules, findOptimumSchedules, type EngineerInput } from '../src/lib/engineer';
import type { VirtualSchedule } from '../src/lib/schedule';

function schedule(...classes: string[]): VirtualSchedule {
	const values = [...classes, ...Array(8).fill('')].slice(0, 8);
	return {
		'1a': values[0],
		'1b': values[1],
		'2a': values[2],
		'2b': values[3],
		'3a': values[4],
		'3b': values[5],
		'4a': values[6],
		'4b': values[7]
	};
}

test('maximizes anchor matches before minimizing movements and is deterministic', () => {
	const inputs: EngineerInput[] = [
		{ student: 'Avery', schedule: schedule('math', 'art') },
		{ student: 'Blake', schedule: schedule('art', 'math') }
	];

	const first = engineerSchedules(inputs);
	const second = engineerSchedules(inputs);

	expect(first).toEqual(second);
	expect(first.status).toBe('success');
	if (first.status !== 'success') return;
	expect(first.sharedPlacements).toBe(2);
	expect(first.movementCost).toBe(2);
	expect(first.schedules.flatMap(({ moves }) => moves)).toHaveLength(2);
	for (const period of ['1a', '1b'] as const) {
		expect(first.schedules[0].proposed[period]).toBe(first.schedules[1].proposed[period]);
	}
});

test('respects locked classes and locked periods', () => {
	const result = engineerSchedules([
		{
			student: 'Anchor',
			schedule: schedule('math', 'art', 'science'),
			locks: { periods: ['1a'] }
		},
		{
			student: 'Friend',
			schedule: schedule('art', 'math', 'science'),
			locks: { classes: ['math'] }
		}
	]);

	expect(result.status).toBe('success');
	if (result.status !== 'success') return;
	const [anchor, friend] = result.schedules;
	expect(anchor.proposed['1a']).toBe('math');
	expect(friend.proposed['1b']).toBe('math');
	expect(anchor.moves).not.toContainEqual(expect.objectContaining({ classId: 'math' }));
	expect(friend.moves).not.toContainEqual(expect.objectContaining({ classId: 'math' }));
	expect(result.sharedPlacements).toBe(2);
});

test('handles incomplete schedules without treating blank periods as shared classes', () => {
	const result = engineerSchedules([
		{ student: 'Anchor', schedule: schedule('math') },
		{ student: 'Friend', schedule: schedule('math') }
	]);

	expect(result.status).toBe('success');
	if (result.status !== 'success') return;
	expect(result.sharedPlacements).toBe(1);
	expect(result.movementCost).toBe(0);
	expect(result.schedules[0].proposed).toEqual(schedule('math'));
});

test('reports empty selection and invalid duplicate classes', () => {
	expect(engineerSchedules([])).toEqual({ status: 'empty' });
	const result = engineerSchedules([{ student: 'Avery', schedule: schedule('math', 'math') }]);
	expect(result.status).toBe('no-solution');
	if (result.status === 'no-solution') expect(result.reason).toContain('same class more than once');
});

test('does not mutate stored schedule inputs', () => {
	const original = schedule('math', 'art');
	const friend = schedule('art', 'math');
	const snapshot = structuredClone([original, friend]);

	engineerSchedules([
		{ student: 'Anchor', schedule: original },
		{ student: 'Friend', schedule: friend }
	]);

	expect([original, friend]).toEqual(snapshot);
});

test('preserves the original helper contract while using the new engineer', () => {
	const original = schedule('math', 'art');
	const friend = schedule('art', 'math');
	const snapshot = structuredClone([original, friend]);
	const result = findOptimumSchedules([original, friend]);

	expect(result[0]).toEqual(result[1]);
	expect(new Set(Object.values(result[0]))).toEqual(new Set(Object.values(original)));
	expect(new Set(Object.values(result[1]))).toEqual(new Set(Object.values(friend)));
	expect([original, friend]).toEqual(snapshot);
});
