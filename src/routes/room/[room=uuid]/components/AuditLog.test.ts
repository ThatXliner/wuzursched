// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, test } from 'vitest';
import AuditLog from './AuditLog.svelte';

const entries = Array.from({ length: 12 }, (_, index) => ({
	id: index + 1,
	created_at: new Date(2026, 6, 30, 10, index).toISOString(),
	action: 'update',
	affected_table: 'classes',
	affected_record: { name: `Class ${index + 1}` }
}));

afterEach(cleanup);

describe('AuditLog', () => {
	test('paginates entries and updates the visible range', async () => {
		render(AuditLog, { entries });

		expect(screen.getByText('Showing 1–10 of 12')).toBeTruthy();
		expect(screen.getByText('{"name":"Class 1"}')).toBeTruthy();
		expect(screen.queryByText('{"name":"Class 11"}')).toBeNull();
		expect(
			(
				screen.getByRole('button', {
					name: 'Previous audit log page'
				}) as HTMLButtonElement
			).disabled
		).toBe(true);

		await fireEvent.click(screen.getByRole('button', { name: 'Next audit log page' }));

		expect(screen.getByText('Showing 11–12 of 12')).toBeTruthy();
		expect(screen.getByText('{"name":"Class 11"}')).toBeTruthy();
		expect(screen.queryByText('{"name":"Class 1"}')).toBeNull();
		expect(
			(screen.getByRole('button', { name: 'Next audit log page' }) as HTMLButtonElement).disabled
		).toBe(true);
	});
});
