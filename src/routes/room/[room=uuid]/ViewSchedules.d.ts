import type { Schedule } from '$lib/schedule';

export type ResolvedYou = {
	name: string;
	schedule: Schedule;
	editToken?: string;
};
export type You = ResolvedYou | null | 'tentative';
