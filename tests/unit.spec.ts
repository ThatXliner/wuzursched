import { expect, test } from '@playwright/test';
import { findOptimumSchedules } from '../src/lib/engineer';
import type { VirtualSchedule } from '../src/lib/InfoInput.d';
import { normalize, setDifference } from '../src/lib/utils';

const makeSchedule = (values: string[]): VirtualSchedule => ({
	'1a': values[0],
	'1b': values[1],
	'2a': values[2],
	'2b': values[3],
	'3a': values[4],
	'3b': values[5],
	'4a': values[6],
	'4b': values[7]
});

test.describe('pure schedule helpers', () => {
	test('normalizes case, whitespace, roman numerals, and ampersand names', () => {
		expect(normalize('  AP   Calculus   II  ')).toBe('ap calculus 2');
		expect(normalize('Space & Electricity')).toBe('se');
	});

	test('computes the symmetric set difference without changing its inputs', () => {
		const left = new Set(['a', 'b']);
		const right = new Set(['b', 'c']);
		expect([...setDifference(left, right)].sort()).toEqual(['a', 'c']);
		expect([...left]).toEqual(['a', 'b']);
	});

	test('aligns a common class and leaves source schedules unchanged', () => {
		const first = makeSchedule(['shared', 'a', 'b', 'c', 'd', 'e', 'f', 'g']);
		const second = makeSchedule(['h', 'shared', 'i', 'j', 'k', 'l', 'm', 'n']);
		const before = structuredClone([first, second]);
		const optimized = findOptimumSchedules([first, second]);

		const sharedPeriods = optimized.map(
			(entry) => Object.entries(entry).find(([, className]) => className === 'shared')?.[0]
		);
		expect(new Set(sharedPeriods).size).toBe(1);
		expect([first, second]).toEqual(before);
		expect(findOptimumSchedules([])).toEqual([]);
	});
});
