import type { Schedule } from '$lib/InfoInput';
import type { You } from './ViewSchedules';

export function isCurrentSchedule(schedule: Schedule, you: You | undefined): boolean {
	return you != null && you !== 'tentative' && schedule.student === you.name;
}

export function prioritizeCurrentSchedule(schedules: Schedule[], you: You | undefined): Schedule[] {
	const ordered = [...schedules];
	const currentIndex = ordered.findIndex((schedule) => isCurrentSchedule(schedule, you));

	if (currentIndex <= 0) {
		return ordered;
	}

	const [current] = ordered.splice(currentIndex, 1);
	ordered.unshift(current);
	return ordered;
}
