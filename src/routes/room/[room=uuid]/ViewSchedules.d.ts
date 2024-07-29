import type { Schedule } from '$lib/InfoInput';

export type You =
	| {
			name: string;
			schedule: Schedule;
	  }
	| null
	| 'tentative';
