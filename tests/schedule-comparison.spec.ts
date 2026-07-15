import { expect, test } from '@playwright/test';
import { getClassMatch, type SchedulePeriod } from '../src/lib/scheduleComparison';
import type { VirtualSchedule } from '../src/lib/schedule';
import {
	hasSharedClass,
	matchesSelectedClasses,
	sharedPeriods
} from '../src/routes/room/[room=uuid]/scheduleComparison';

function schedule(overrides: Partial<Record<SchedulePeriod, string>> = {}): VirtualSchedule {
	return {
		'1a': 'algebra',
		'2a': 'biology',
		'3a': 'chemistry',
		'4a': 'drama',
		'1b': 'english',
		'2b': 'french',
		'3b': 'geometry',
		'4b': 'history',
		...overrides
	};
}

const blair = schedule({
	'2a': 'spanish',
	'3a': 'chemistry',
	'4a': 'design',
	'1b': 'literature',
	'2b': 'physics',
	'3b': 'band',
	'4b': 'health'
});

test('counts shared periods for compact match summaries', () => {
	const alex = schedule();
	expect(sharedPeriods(alex, blair)).toEqual(['1a', '3a']);
	expect(hasSharedClass(alex, blair)).toBe(true);
});

test('requires every selectively filtered class to match', () => {
	expect(matchesSelectedClasses(blair, { '1a': 'algebra', '3a': 'chemistry' })).toBe(true);
	expect(matchesSelectedClasses(blair, { '1a': 'algebra', '2a': 'biology' })).toBe(false);
	expect(matchesSelectedClasses(blair, {})).toBe(true);
});

test('marks a class in the same A-day period as a same-period match', () => {
	const theirs = schedule();
	const yours = schedule({ '2a': 'biology', '4a': 'biology' });

	expect(getClassMatch(theirs, yours, '2a')).toBe('same-period');
});

test('checks the entire schedule for a class in a different A-day period', () => {
	const theirs = schedule();
	const yours = schedule({ '2a': 'calculus', '4b': 'biology' });

	expect(getClassMatch(theirs, yours, '2a')).toBe('different-period');
});

test('checks the entire schedule for a class in a different B-day period', () => {
	const theirs = schedule();
	const yours = schedule({ '3b': 'art', '1a': 'geometry' });

	expect(getClassMatch(theirs, yours, '3b')).toBe('different-period');
});

test('leaves a class unmarked when it is absent from the other schedule', () => {
	const theirs = schedule();
	const yours = schedule({ '1b': 'music' });

	expect(getClassMatch(theirs, yours, '1b')).toBe('not-shared');
});
