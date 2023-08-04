import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase';
import { normalize } from '$lib/utils';
import memoize from 'lodash-es/memoize';
import type { VirtualSchedule } from './InfoInput';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
	auth: {
		persistSession: false
	}
});
async function _getClass(id: string) {
	const { data, error } = await supabase.from('classes').select('*').eq('id', id);
	if (error !== null) {
		throw error;
	}
	console.assert(data !== null);
	return data![0];
}
export const getClass = memoize(_getClass);
export async function getClasses(room: string) {
	return await supabase.from('classes').select('*').eq('room', room);
}
export type AddClassParams = {
	className: string;
	firstName: string;
	lastName: string;
	room: string;
};
export async function addClass({
	className,
	firstName,
	lastName,
	room
}: AddClassParams): Promise<string> {
	const payload = {
		name: normalize(className),
		teacher_first: firstName.trim().toLowerCase(),
		teacher_last: lastName.trim().toLowerCase(),
		room
	};
	const { data, error } = await supabase.from('classes').insert([payload]).select();
	if (error !== null) {
		throw error;
	}
	return data[0].id;
}
