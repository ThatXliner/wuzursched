// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Schedule } from '$lib/schedule';
import ScheduleBrowser from './ScheduleBrowser.svelte';
import type { Class } from './types';

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
		teacher_last: 'Hopper',
		teacher_title: null
	};
}

afterEach(cleanup);

describe('ScheduleBrowser', () => {
	test('loads details only after a person is selected', async () => {
		const getClass = vi.fn(async (id: string) => classRecord(id));
		render(ScheduleBrowser, {
			schedules: [schedule],
			you: { name: 'Ada', schedule },
			getClass
		});

		expect(getClass).not.toHaveBeenCalled();
		expect(screen.queryByRole('table')).toBeNull();
		const person = screen.getByRole('button', { name: /Ada/ });
		await waitFor(() => expect((person as HTMLButtonElement).disabled).toBe(false));
		await fireEvent.click(person);
		await screen.findByRole('table');
		expect(getClass).toHaveBeenCalledTimes(8);
	});

	test('contains a detail-loading failure without losing the people list', async () => {
		const getClass = vi
			.fn<(id: string) => Promise<Class>>()
			.mockRejectedValue(new Error('offline'));
		render(ScheduleBrowser, {
			schedules: [schedule],
			you: { name: 'Ada', schedule },
			getClass
		});

		const person = screen.getByRole('button', { name: /Ada/ });
		await waitFor(() => expect((person as HTMLButtonElement).disabled).toBe(false));
		await fireEvent.click(person);
		expect((await screen.findByRole('alert')).textContent).toContain("couldn't load this schedule");
		expect(screen.getByRole('button', { name: /Ada/ })).toBeTruthy();
	});
});
