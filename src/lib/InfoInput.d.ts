export type VirtualSchedule = {
	'1a': string;
	'1b': string;
	'2a': string;
	'2b': string;
	'3a': string;
	'3b': string;
	'4a': string;
	'4b': string;
};
export type UnfinishedSchedule = Partial<VirtualSchedule>;
export const PERIODS: (keyof VirtualSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
import { supabase } from './db';
import type { ArrElement } from '$lib/utils';
async function getClasses(room: string) {
	return await supabase.from('classes').select('*').eq('room', room);
}

type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
export type Class = ArrElement<Classes>;
