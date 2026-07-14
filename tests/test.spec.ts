import { expect, test } from '@playwright/test';
import { formatClassUsage } from '../src/lib/classUsage';

test('index page has expected h1', async ({ page }) => {
	await page.goto('/');
	expect(await page.textContent('h1')).toBe('Wuzursched');
});

test('class usage labels use clear singular and plural forms', () => {
	expect(formatClassUsage(0)).toBe('0 schedules');
	expect(formatClassUsage(1)).toBe('1 schedule');
	expect(formatClassUsage(12)).toBe('12 schedules');
});
