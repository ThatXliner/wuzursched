import type { VirtualSchedule } from '$lib/schedule';

export const SCHEDULE_PERIODS = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;

export type SchedulePeriod = (typeof SCHEDULE_PERIODS)[number];
export type ClassMatch = 'same-period' | 'different-period' | 'not-shared';

export function getClassMatch(
	theirSchedule: VirtualSchedule,
	yourSchedule: VirtualSchedule,
	period: SchedulePeriod
): ClassMatch {
	const classId = theirSchedule[period];

	if (yourSchedule[period] === classId) {
		return 'same-period';
	}

	if (SCHEDULE_PERIODS.some((yourPeriod) => yourSchedule[yourPeriod] === classId)) {
		return 'different-period';
	}

	return 'not-shared';
}
