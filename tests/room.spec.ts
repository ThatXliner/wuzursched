import { expect, test } from '@playwright/test';
import { adminClient, classes, removeRoom, resetRoom, ROOM_ID, schedule } from './helpers/database';
import { rememberIdentity, selectFixtureSchedule } from './helpers/ui';

test.describe('critical room flows', () => {
	test.afterEach(removeRoom);

	test('creates a room and loads it again from the landing page', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: 'Create a room' }).first().click();
		await expect(page).toHaveURL(/\/room\/[0-9a-f-]{36}$/);
		await expect(page.getByRole('heading', { level: 1, name: /^Room / })).toBeVisible();
		await expect(page.getByText('0 schedules in this room so far')).toBeVisible();

		const roomId = page.url().split('/').at(-1)!;
		await page.goto('/');
		await page.getByPlaceholder('Paste a room link or ID').fill(roomId);
		await page.getByRole('button', { name: 'Join' }).click();
		await expect(page).toHaveURL(`/room/${roomId}`);
		await adminClient().from('rooms').delete().eq('id', roomId);
	});

	test('submits a schedule and restores the local room identity', async ({ page }) => {
		await resetRoom({ withSchedules: false });
		await page.goto(`/room/${ROOM_ID}`);
		await expect(page.getByRole('heading', { name: 'But first...' })).toBeVisible();
		await page.getByPlaceholder('Bryan Hu').fill('Alice');
		await selectFixtureSchedule(page);
		await page
			.getByRole('checkbox', { name: 'I reviewed this schedule and confirm it is ready to submit.' })
			.check();
		await page.getByRole('button', { name: 'Submit schedule' }).click();

		await expect
			.poll(() => page.evaluate((room) => localStorage.getItem(room), ROOM_ID))
			.toContain('Alice');

		await page.reload();
		await expect(page.getByRole('heading', { name: 'But first...' })).toBeHidden();
		const people = page
			.getByRole('tabpanel', { name: 'All Schedules' })
			.getByLabel('People');
		await expect(people.getByRole('button', { name: /Alice/i })).toBeVisible();
		await expect(people.locator('[data-current-user="true"]')).toContainText('Alice');
	});

	test('searches, creates, selects, and rejects duplicate classes', async ({ page }) => {
		const admin = await resetRoom({ withSchedules: false });
		await page.goto(`/room/${ROOM_ID}`);
		await page.getByRole('button', { name: '1A', exact: true }).click();
		let dialog = page.locator('dialog[open]');
		await dialog.getByPlaceholder('Class name').fill('geom');
		await expect(dialog.getByText(/Geometry/i)).toBeVisible();
		await dialog.getByText(/Geometry/i).click();

		await page.getByRole('button', { name: '2A', exact: true }).click();
		dialog = page.locator('dialog[open]');
		await dialog.getByPlaceholder('Class name').fill('Space & Electricity');
		await dialog.getByLabel('Teacher name type').selectOption('title');
		await dialog.getByLabel('Teacher title').selectOption('Dr');
		await dialog.getByLabel('Teacher last name').fill('Stone');
		await dialog.getByRole('button', { name: 'Create class' }).click();
		await expect
			.poll(async () => {
				const { count } = await admin
					.from('classes')
					.select('*', { count: 'exact', head: true })
					.eq('room', ROOM_ID)
					.eq('name', 'se');
				return count;
			})
			.toBe(1);

		await page.getByRole('button', { name: '3A', exact: true }).click();
		dialog = page.locator('dialog[open]');
		await dialog.getByPlaceholder('Class name').fill('Space & Electricity');
		await dialog.getByLabel('Teacher name type').selectOption('title');
		await dialog.getByLabel('Teacher title').selectOption('Dr');
		await dialog.getByLabel('Teacher last name').fill('Stone');
		await dialog.getByRole('button', { name: 'Create class' }).click();
		await expect(page.getByText('Attempted to add duplicate class').first()).toBeVisible();

		const { count, error } = await admin
			.from('classes')
			.select('*', { count: 'exact', head: true })
			.eq('room', ROOM_ID)
			.eq('name', 'se')
			.is('teacher_first', null)
			.eq('teacher_title', 'Dr')
			.eq('teacher_last', 'Stone');
		expect(error).toBeNull();
		expect(count).toBe(1);
	});

	test('searches schedules and applies matching and shared-class filters', async ({ page }) => {
		await resetRoom();
		await rememberIdentity(page);
		await page.goto(`/room/${ROOM_ID}`);

		const schedulesPanel = page.getByRole('tabpanel', { name: 'All Schedules' });
		const people = schedulesPanel.getByLabel('People');
		const search = page.getByPlaceholder('Search for a student');
		await search.fill('Bob');
		await expect(people.getByRole('button', { name: /Bob/i })).toBeVisible();
		await expect(people.getByRole('button', { name: /Cara/i })).toHaveCount(0);
		await search.clear();

		await page.getByText('Only show matching').click();
		await expect(people.getByRole('button', { name: /Bob/i })).toBeVisible();
		await expect(people.getByRole('button', { name: /Cara/i })).toHaveCount(0);

		await page.getByRole('tab', { name: 'Filter' }).click();
		const sharedClassButton = page.getByRole('button', { name: /Algebra Ava Adams/i });
		await sharedClassButton.click();
		await expect(sharedClassButton).toHaveClass(/btn-active/);
		const filterPanel = page.getByRole('tabpanel', { name: 'Filter' });
		const filteredPeople = filterPanel.getByLabel('People');
		await expect(filteredPeople.getByRole('button', { name: /Bob/i })).toBeVisible();
		await expect(filteredPeople.getByRole('button', { name: /Cara/i })).toHaveCount(0);
	});

	test('handles realtime inserts and clears reset or stale identities', async ({ page }) => {
		await resetRoom();
		await rememberIdentity(page);
		await page.goto(`/room/${ROOM_ID}`);
		await expect(page.getByText('connected', { exact: true })).toBeVisible();

		const realtimeSchedule = schedule('Delta', [2, 3, 4, 5, 6, 7, 0, 1]);
		const { error } = await adminClient().from('schedules').insert(realtimeSchedule);
		expect(error).toBeNull();
		await expect(
			page
				.getByRole('tabpanel', { name: 'All Schedules' })
				.getByLabel('People')
				.getByRole('button', { name: /Delta/i })
		).toBeVisible();
		await expect(page.getByText('Delta just added their schedule to this room')).toBeVisible();

		await page.getByRole('button', { name: 'Reset who you are' }).click();
		expect(await page.evaluate((room) => localStorage.getItem(room), ROOM_ID)).toBeNull();
		await page.reload();
		await expect(page.getByRole('heading', { name: 'But first...' })).toBeVisible();

		await page.evaluate(
			({ room, classIds }) =>
				localStorage.setItem(
					room,
					JSON.stringify({ name: 'Ghost', schedule: { ...classIds, room, student: 'Ghost' } })
				),
			{
				room: ROOM_ID,
				classIds: Object.fromEntries(
					['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'].map((period, index) => [
						period,
						classes[index][0]
					])
				)
			}
		);
		await page.reload();
		await expect(page.getByRole('heading', { name: 'But first...' })).toBeVisible();
		expect(await page.evaluate((room) => localStorage.getItem(room), ROOM_ID)).toBeNull();
	});
});
