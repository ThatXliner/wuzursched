import { expect, test } from '@playwright/test';

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
