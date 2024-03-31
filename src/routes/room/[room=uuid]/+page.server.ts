import { error as returnError, type ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params, locals: { supabase } }) => {
	if (
		// Because reading rooms is not a all-public thing
		((await supabase.from('rooms').select('*').eq('id', params.room!)).data ?? []).length === 0
	) {
		throw returnError(404, 'Room does not exist');
	}
	// Surely not a N+1
	const { data, error } = await supabase.from('schedules').select('*').eq('room', params.room!);

	if (error !== null) {
		throw error;
	}
	return {
		data,
		supabase
	};
};
