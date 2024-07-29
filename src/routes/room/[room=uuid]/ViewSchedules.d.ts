import type { Schedule } from '$lib/InfoInput';

export type ResolvedYou = {
	name: string;
	schedule: Schedule;
};
export type You = ResolvedYou | null | 'tentative';
