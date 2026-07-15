import { expect, test } from '@playwright/test';
import {
	hasSharedClass,
	matchesSelectedClasses,
	sharedPeriods
} from '../src/routes/room/[room=uuid]/scheduleComparison';

const alex = {
	'1a': 'algebra',
	'2a': 'biology',
	'3a': 'history',
	'4a': 'art',
	'1b': 'english',
	'2b': 'chemistry',
	'3b': 'music',
	'4b': 'pe'
};

const blair = {
	'1a': 'algebra',
	'2a': 'spanish',
	'3a': 'history',
	'4a': 'design',
	'1b': 'literature',
	'2b': 'physics',
	'3b': 'band',
	'4b': 'health'
};

test('counts shared periods for compact match summaries', () => {
	expect(sharedPeriods(alex, blair)).toEqual(['1a', '3a']);
	expect(hasSharedClass(alex, blair)).toBe(true);
});

test('requires every selectively filtered class to match', () => {
	expect(matchesSelectedClasses(blair, { '1a': 'algebra', '3a': 'history' })).toBe(true);
	expect(matchesSelectedClasses(blair, { '1a': 'algebra', '2a': 'biology' })).toBe(false);
	expect(matchesSelectedClasses(blair, {})).toBe(true);
});
