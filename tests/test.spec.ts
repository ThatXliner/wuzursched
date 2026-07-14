import { expect, test } from '@playwright/test';
import { pinSelectedItem } from '../src/lib/classPicker';

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
