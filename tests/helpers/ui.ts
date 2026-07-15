import { expect, type Page } from '@playwright/test';
import { classes, ROOM_ID, schedule } from './database';

export async function rememberIdentity(page: Page, student = 'Alice') {
	await page.goto('/');
	await page.evaluate(
		({ room, identity }) => localStorage.setItem(room, JSON.stringify(identity)),
		{ room: ROOM_ID, identity: { name: student, schedule: schedule(student) } }
	);
}

export async function selectFixtureSchedule(page: Page) {
	const periods = ['1A', '2A', '3A', '4A', '1B', '2B', '3B', '4B'];
	for (const [index, period] of periods.entries()) {
		const periodButton = page.getByRole('button', { name: period, exact: true });
		for (let attempt = 0; attempt < 3; attempt += 1) {
			await periodButton.click();
			const dialog = page.locator('dialog[open]');
			await expect(dialog).toBeVisible();
			await dialog
				.getByRole('button', {
					name: new RegExp(`^${classes[index][1]} ${classes[index][2]} ${classes[index][3]}$`, 'i')
				})
				.click();
			if ((await periodButton.getAttribute('class'))?.includes('btn-success')) break;
		}
		await expect(periodButton).toHaveClass(/btn-success/);
	}
}
