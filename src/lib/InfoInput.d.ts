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
export type UnfinishedSchedule = {
	'1a'?: string;
	'1b'?: string;
	'2a'?: string;
	'2b'?: string;
	'3a'?: string;
	'3b'?: string;
	'4a'?: string;
	'4b'?: string;
};
import { supabase } from './db';
import type { ArrElement } from '$lib/utils';
async function getClasses(room: string) {
	return await supabase.from('classes').select('*').eq('room', room);
}

export type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
export type Class = ArrElement<Classes>;
