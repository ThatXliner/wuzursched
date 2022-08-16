import { supabase } from '$lib/db';
import type { definitions } from '$lib/db.d';
import { error } from '@sveltejs/kit';
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (
		(
			(await supabase.from<definitions['rooms']>('rooms').select('*').eq('id', params.room))[
				'data'
			] ?? []
		).length === 0
	) {
		throw error(404, 'Room does not exist');
	}
	const { data: schedules, error: schedule_error } = await supabase
		.from<definitions['schedules']>('schedules')
		.select('*')
		.eq('room', params.room);

	if (schedules === null) {
		throw schedule_error;
	}

	return {
		schedules
	};
}
