import type { VirtualSchedule } from './InfoInput.d';

export const PERIODS = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b'] as const;

export type Period = (typeof PERIODS)[number];

export type ScheduleLocks = {
	periods?: Iterable<Period>;
	classes?: Iterable<string>;
};

export type EngineerInput = {
	student: string;
	schedule: VirtualSchedule;
	locks?: ScheduleLocks;
};

export type ScheduleMove = {
	classId: string;
	from: Period;
	to: Period;
};

export type EngineeredSchedule = {
	student: string;
	original: VirtualSchedule;
	proposed: VirtualSchedule;
	moves: ScheduleMove[];
};

export type EngineerResult =
	| { status: 'empty' }
	| { status: 'no-solution'; reason: string }
	| {
			status: 'success';
			anchor: string;
			sharedPlacements: number;
			movementCost: number;
			schedules: EngineeredSchedule[];
	  };

type NormalizedLocks = {
	periods: Set<Period>;
	classes: Set<string>;
};

type ScheduleItem = {
	id: number;
	classId: string;
	originalPeriod: Period;
};

function normalizedLocks(locks?: ScheduleLocks): NormalizedLocks {
	return {
		periods: new Set(locks?.periods ?? []),
		classes: new Set(locks?.classes ?? [])
	};
}

function classPeriods(schedule: VirtualSchedule): Map<string, Period> {
	const result = new Map<string, Period>();
	for (const period of PERIODS) {
		const classId = schedule[period];
		if (classId) result.set(classId, period);
	}
	return result;
}

function validateInput(input: EngineerInput): string | undefined {
	const seen = new Set<string>();
	for (const period of PERIODS) {
		const classId = input.schedule[period];
		if (!classId) continue;
		if (seen.has(classId)) {
			return `${input.student}'s schedule contains the same class more than once.`;
		}
		seen.add(classId);
	}

	const locks = normalizedLocks(input.locks);
	for (const period of locks.periods) {
		if (!PERIODS.includes(period)) return `${input.student} has an unknown locked period.`;
	}
	for (const classId of locks.classes) {
		if (!seen.has(classId)) return `${input.student} has a lock for a class not in their schedule.`;
	}
	return undefined;
}

function* anchorCandidates(input: EngineerInput): Generator<VirtualSchedule> {
	const locks = normalizedLocks(input.locks);
	const items: ScheduleItem[] = PERIODS.map((period, id) => ({
		id,
		classId: input.schedule[period] ?? '',
		originalPeriod: period
	}));
	const fixedByPeriod = new Map<Period, ScheduleItem>();
	const fixedIds = new Set<number>();

	for (const item of items) {
		if (
			locks.periods.has(item.originalPeriod) ||
			(item.classId && locks.classes.has(item.classId))
		) {
			fixedByPeriod.set(item.originalPeriod, item);
			fixedIds.add(item.id);
		}
	}

	const built: Partial<VirtualSchedule> = {};
	const used = new Set<number>();
	function* visit(index: number): Generator<VirtualSchedule> {
		if (index === PERIODS.length) {
			yield { ...built } as VirtualSchedule;
			return;
		}

		const period = PERIODS[index];
		const fixed = fixedByPeriod.get(period);
		if (fixed) {
			built[period] = fixed.classId;
			used.add(fixed.id);
			yield* visit(index + 1);
			used.delete(fixed.id);
			return;
		}

		// Empty slots are interchangeable. Avoid emitting the same incomplete schedule repeatedly.
		const valuesTried = new Set<string>();
		for (const item of items) {
			if (used.has(item.id) || fixedIds.has(item.id) || valuesTried.has(item.classId)) continue;
			valuesTried.add(item.classId);
			built[period] = item.classId;
			used.add(item.id);
			yield* visit(index + 1);
			used.delete(item.id);
		}
	}

	yield* visit(0);
}

function buildFriendProposal(input: EngineerInput, anchor: VirtualSchedule): VirtualSchedule {
	const locks = normalizedLocks(input.locks);
	const originalPeriods = classPeriods(input.schedule);
	const proposed: Partial<VirtualSchedule> = {};
	const placed = new Set<string>();

	// Period and class locks both pin the current value to its original period.
	for (const period of PERIODS) {
		const classId = input.schedule[period];
		if (locks.periods.has(period) || (classId && locks.classes.has(classId))) {
			proposed[period] = classId;
			if (classId) placed.add(classId);
		}
	}

	// Every feasible anchor match is independent: anchor classes occupy distinct target periods.
	for (const period of PERIODS) {
		const classId = anchor[period];
		if (!classId || placed.has(classId) || !originalPeriods.has(classId)) continue;
		const originalPeriod = originalPeriods.get(classId)!;
		if (locks.classes.has(classId) && originalPeriod !== period) continue;
		if (proposed[period] !== undefined && proposed[period] !== classId) continue;
		proposed[period] = classId;
		placed.add(classId);
	}

	// Preserve every remaining class that can stay put. This minimizes movement after matches.
	for (const period of PERIODS) {
		const classId = input.schedule[period];
		if (classId && !placed.has(classId) && proposed[period] === undefined) {
			proposed[period] = classId;
			placed.add(classId);
		}
	}

	// Any still-displaced classes have equal movement cost. Sort them for deterministic tie-breaking.
	const remainingClasses = [...originalPeriods.keys()].filter((id) => !placed.has(id)).sort();
	const remainingPeriods = PERIODS.filter((period) => proposed[period] === undefined);
	for (let index = 0; index < remainingPeriods.length; index += 1) {
		proposed[remainingPeriods[index]] = remainingClasses[index] ?? '';
	}
	return proposed as VirtualSchedule;
}

function movesBetween(original: VirtualSchedule, proposed: VirtualSchedule): ScheduleMove[] {
	const proposedPeriods = classPeriods(proposed);
	const moves: ScheduleMove[] = [];
	for (const from of PERIODS) {
		const classId = original[from];
		if (!classId) continue;
		const to = proposedPeriods.get(classId)!;
		if (from !== to) moves.push({ classId, from, to });
	}
	return moves;
}

function countShared(anchor: VirtualSchedule, friend: VirtualSchedule): number {
	return PERIODS.filter((period) => Boolean(anchor[period]) && anchor[period] === friend[period])
		.length;
}

function proposalKey(proposals: VirtualSchedule[]): string {
	return proposals
		.flatMap((schedule) => PERIODS.map((period) => schedule[period] ?? ''))
		.join('\u0000');
}

/**
 * Produces a proposal without mutating any input schedule.
 *
 * Objective, in order:
 * 1. Maximize class/period matches between the first selected student (the anchor) and every friend.
 * 2. Minimize the total number of classes moved from their original period.
 * 3. Choose the lexicographically smallest proposal, making ties deterministic.
 */
export function engineerSchedules(inputs: EngineerInput[]): EngineerResult {
	if (inputs.length === 0) return { status: 'empty' };
	for (const input of inputs) {
		const error = validateInput(input);
		if (error) return { status: 'no-solution', reason: error };
	}

	let best:
		| { sharedPlacements: number; movementCost: number; proposals: VirtualSchedule[]; key: string }
		| undefined;

	for (const anchor of anchorCandidates(inputs[0])) {
		const proposals = [
			anchor,
			...inputs.slice(1).map((input) => buildFriendProposal(input, anchor))
		];
		const sharedPlacements = proposals
			.slice(1)
			.reduce((total, proposal) => total + countShared(anchor, proposal), 0);
		const movementCost = proposals.reduce(
			(total, proposal, index) => total + movesBetween(inputs[index].schedule, proposal).length,
			0
		);
		const key = proposalKey(proposals);

		if (
			!best ||
			sharedPlacements > best.sharedPlacements ||
			(sharedPlacements === best.sharedPlacements && movementCost < best.movementCost) ||
			(sharedPlacements === best.sharedPlacements &&
				movementCost === best.movementCost &&
				key < best.key)
		) {
			best = { sharedPlacements, movementCost, proposals, key };
		}
	}

	if (!best)
		return { status: 'no-solution', reason: 'The locked constraints cannot be satisfied.' };
	return {
		status: 'success',
		anchor: inputs[0].student,
		sharedPlacements: best.sharedPlacements,
		movementCost: best.movementCost,
		schedules: inputs.map((input, index) => ({
			student: input.student,
			original: input.schedule,
			proposed: best!.proposals[index],
			moves: movesBetween(input.schedule, best!.proposals[index])
		}))
	};
}

// Kept as a small compatibility wrapper for callers of the original unfinished helper.
export function findOptimumSchedules(schedules: VirtualSchedule[]): VirtualSchedule[] {
	const result = engineerSchedules(
		schedules.map((schedule, index) => ({ student: `Student ${index + 1}`, schedule }))
	);
	return result.status === 'success' ? result.schedules.map(({ proposed }) => proposed) : [];
}
