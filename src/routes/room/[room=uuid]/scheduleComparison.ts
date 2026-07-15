import type { Schedule, UnfinishedSchedule, VirtualSchedule } from '$lib/schedule';

export const PERIODS = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;

export function sharedPeriods(a: VirtualSchedule, b: VirtualSchedule) {
	return PERIODS.filter((period) => a[period] === b[period]);
}

export function hasSharedClass(a: VirtualSchedule, b: VirtualSchedule) {
	return sharedPeriods(a, b).length > 0;
}

export function matchesSelectedClasses(schedule: VirtualSchedule, selected: UnfinishedSchedule) {
	return PERIODS.every(
		(period) => selected[period] === undefined || schedule[period] === selected[period]
	);
}

export function scheduleKey(schedule: Schedule) {
	return `${schedule.room}:${schedule.student}`;
}
