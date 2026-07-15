import type { Schedule } from '$lib/schedule';

export type ResolvedYou = {
	name: string;
	schedule: Schedule;
};
export type You = ResolvedYou | null | 'tentative';
