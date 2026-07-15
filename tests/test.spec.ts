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
