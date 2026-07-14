import { expect, test } from '@playwright/test';
import { findOptimumSchedules } from '../src/lib/engineer';
import type { VirtualSchedule } from '../src/lib/InfoInput.d';

const first: VirtualSchedule = {
	'1a': 'algebra',
	'1b': 'biology',
	'2a': 'chemistry',
	'2b': 'drama',
	'3a': 'english',
	'3b': 'french',
	'4a': 'geometry',
	'4b': 'history'
};

const second: VirtualSchedule = {
	'1a': 'biology',
	'1b': 'algebra',
	'2a': 'drama',
	'2b': 'chemistry',
	'3a': 'french',
	'3b': 'english',
	'4a': 'history',
	'4b': 'geometry'
};

test('schedule engineering aligns common classes without changing each class set', () => {
	const originals = structuredClone([first, second]);
	const result = findOptimumSchedules([first, second]);

	expect(result[0]).toEqual(result[1]);
	expect(new Set(Object.values(result[0]))).toEqual(new Set(Object.values(first)));
	expect(new Set(Object.values(result[1]))).toEqual(new Set(Object.values(second)));
	expect([first, second]).toEqual(originals);
});

test('schedule engineering accepts an empty selection', () => {
	expect(findOptimumSchedules([])).toEqual([]);
});
