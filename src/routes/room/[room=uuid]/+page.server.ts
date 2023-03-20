import { supabase } from '$lib/server/db';
import { error } from '@sveltejs/kit';
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (
		// Because reading rooms is not a all-public thing
		((await supabase.from('rooms').select('*').eq('id', params.room))['data'] ?? []).length === 0
	) {
		throw error(404, 'Room does not exist');
	}
	const { data: schedules, error: schedule_error } = await supabase
		.from('schedules')
		.select('*')
		.eq('room', params.room);

	if (schedules === null) {
		throw schedule_error;
	}

	return {
		schedules
	};
}
