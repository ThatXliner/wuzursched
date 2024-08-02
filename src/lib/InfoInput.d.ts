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
export type Schedule = VirtualSchedule & {
	room: string;
	student: string;
};
export type UnfinishedSchedule = Partial<VirtualSchedule>;
export const PERIODS = ['1a', '1b', '2a', '2b', '3a', '3b', '4a', '4b'] as const;
import type { ArrElement } from '$lib/utils';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './supabase';
async function getClasses(supabase: SupabaseClient<Database>, room: string) {
	return await supabase.from('classes').select('*').eq('room', room);
}

export type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
export type Class = ArrElement<Classes>;
