// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Schedule } from '$lib/schedule';
import type { Class } from './types';
import ViewSchedule from './ViewSchedule.svelte';

const schedule: Schedule = {
	room: 'room-id',
	student: 'Ada',
	'1a': 'class-1',
	'2a': 'class-2',
	'3a': 'class-3',
	'4a': 'class-4',
	'1b': 'class-5',
	'2b': 'class-6',
	'3b': 'class-7',
	'4b': 'class-8'
};

function classRecord(id: string): Class {
	return {
		id,
		room: 'room-id',
		name: id,
		teacher_first: 'Grace',
		teacher_last: 'Hopper'
	};
}

afterEach(cleanup);

describe('ViewSchedule', () => {
	test('loads details only after expansion and keeps them cached when reopened', async () => {
		let finishLoading!: () => void;
		const pending = new Promise<void>((resolve) => (finishLoading = resolve));
		const getClass = vi.fn(async (id: string) => {
			await pending;
			return classRecord(id);
		});
		render(ViewSchedule, {
			schedule,
			you: { name: 'Ada', schedule },
			getClass
		});

		const toggle = screen.getByRole('button', { name: "Ada's schedule (you)" });
		expect(toggle.getAttribute('aria-expanded')).toBe('false');
		expect(getClass).not.toHaveBeenCalled();
		expect(screen.queryByRole('table')).toBeNull();

		await fireEvent.click(toggle);
		expect(toggle.getAttribute('aria-expanded')).toBe('true');
		expect(screen.getByRole('status').textContent).toContain('Loading schedule');
		finishLoading();
		await screen.findByRole('table');
		expect(getClass).toHaveBeenCalledTimes(8);

		await fireEvent.click(toggle);
		expect(screen.queryByRole('table')).toBeNull();
		await fireEvent.click(toggle);
		await screen.findByRole('table');
		expect(getClass).toHaveBeenCalledTimes(8);
	});

	test('shows a local error and can retry without affecting the card summary', async () => {
		const getClass = vi
			.fn<(id: string) => Promise<Class>>()
			.mockRejectedValueOnce(new Error('network error'))
			.mockImplementation(async (id) => classRecord(id));
		render(ViewSchedule, {
			schedule,
			you: { name: 'Other student', schedule },
			getClass
		});

		await fireEvent.click(screen.getByRole('button', { name: "Ada's schedule" }));
		expect((await screen.findByRole('alert')).textContent).toContain(
			'Unable to load this schedule.'
		);
		expect(screen.getByRole('button', { name: "Ada's schedule" })).toBeTruthy();

		await fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
		await waitFor(() => expect(screen.getByRole('table')).toBeTruthy());
	});
});
