import { supabase } from '$lib/server/db';
import { error as returnError} from '@sveltejs/kit';
/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	if (
		// Because reading rooms is not a all-public thing
		((await supabase.from('rooms').select('*').eq('id', params.room))['data'] ?? []).length === 0
	) {
		throw returnError(404, 'Room does not exist');
	}
	const { data, error } = await supabase
		.from('schedules')
		.select('*')
		.eq('room', params.room);

	if (error !== null) {
		throw error;
	}

	return {
		data
	};
}
