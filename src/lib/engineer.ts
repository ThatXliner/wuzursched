// Implements the schedule engineering algorithm

import { sum } from 'lodash-es';
import { type VirtualSchedule, PERIODS, type UnfinishedSchedule } from './InfoInput.d';
import { setDifference, type ArrElement } from './utils';
function scheduleToClassSet(schedule: VirtualSchedule) {
	const classSet = new Set<string>();
	for (const time of Object.keys(schedule)) {
		const className = schedule[time as keyof VirtualSchedule];
		if (className) {
			classSet.add(className);
		}
	}
	return classSet;
}
function findCommonClasses(schedules: VirtualSchedule[]) {
	const classSets = schedules.map(scheduleToClassSet);
	const commonClasses = new Set<string>();
	for (const className of classSets) {
		if (classSets.every((classSet) => classSet.has(className))) {
			commonClasses.add(className);
		}
	}
	return commonClasses;
}
// A heuristic to determine how much two schedules differ
// (you should be minimizing this)
function scheduleMovementHeuristic(a: VirtualSchedule, b: VirtualSchedule) {
	return Object.entries(a).filter(([key, value]) => value !== b[key as keyof VirtualSchedule])
		.length;
}
// Maximize the chance of having a common class for all schedules
// e.g. if we all have the same math class, move the math class to the same time
// and if only my friend and I have the D&A class,
// still move the D&A class to the same time as he does.
// TODO: In the future, we will respect the restrictions of which
// periods each class can be in
export function findOptimumSchedules(schedules: VirtualSchedule[]): VirtualSchedule[] {
	const commonClasses = findCommonClasses(schedules);
	function cost(schedule: VirtualSchedule) {
		return sum(schedules.map((x) => scheduleMovementHeuristic(schedule, x)));
	}
	const cache: Record<string, VirtualSchedule> = {};
	// Build the common schedule (leaving uncommon classes as blank)
	// with the least amount of movement from the original schedules
	function dpBuildCommonSchedule(
		builtSoFar: UnfinishedSchedule,
		period: ArrElement<typeof PERIODS>
	): VirtualSchedule {
		const classesLeft = setDifference(commonClasses, Object.values(builtSoFar));
		const key = JSON.stringify({ classesLeft: [...classesLeft], period });
		if (cache[key]) {
			return cache[key];
		}
		if (period === PERIODS[PERIODS.length - 1]) {
			if (classesLeft.size === 1) {
				return (cache[key] = { ...builtSoFar, [period]: [...classesLeft][0] } as VirtualSchedule);
			} else if (classesLeft.size === 0) {
				return (cache[key] = builtSoFar as VirtualSchedule);
			} else {
				throw new Error('Impossible to build common schedule');
			}
		}
		let bestScheduleSoFar;
		let minDistance;
		if (PERIODS.indexOf(period) === PERIODS.length - classesLeft.size) {
			// Don't leave it blank
			minDistance = Number.POSITIVE_INFINITY;
		} else {
			if (PERIODS.indexOf(period) > PERIODS.length - classesLeft.size) {
				throw new Error('Impossible.');
			}
			// Try leaving it blank
			bestScheduleSoFar = dpBuildCommonSchedule(builtSoFar, PERIODS[PERIODS.indexOf(period) + 1]);
			minDistance = cost(bestScheduleSoFar);
		}
		for (const classLeft of classesLeft) {
			const newSchedule = { ...builtSoFar, [period]: classLeft };
			const nextPeriod = PERIODS[PERIODS.indexOf(period) + 1];

			const candidate = dpBuildCommonSchedule(newSchedule, nextPeriod);
			const distance = cost(candidate);

			if (distance < minDistance) {
				minDistance = distance;
				bestScheduleSoFar = candidate;
			}
		}
		return (cache[key] = bestScheduleSoFar as VirtualSchedule);
	}
	const commonSchedule = dpBuildCommonSchedule({}, PERIODS[0]);
	// Fill in the blanks left by common schedule for every student
	// with the remaining classes of the student
	return schedules.map((schedule) => {
		// Shallow copy to avoid any reference issues
		const filledSchedule = { ...commonSchedule };
		const classesLeft = setDifference(new Set(Object.values(schedule)), commonClasses);
		for (const time of Object.keys(schedule)) {
			if (filledSchedule[time as keyof VirtualSchedule] == undefined) {
				filledSchedule[time as keyof VirtualSchedule] = [...classesLeft][0];
				classesLeft.delete([...classesLeft][0]);
			}
		}
		return filledSchedule;
	});
}
