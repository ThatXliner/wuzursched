import { supabase } from '$lib/db';
import type { definitions } from '$lib/db.d';

/** @type {import('./__types/items').RequestHandler} */
export async function GET() {
	// TODO: Manage the rare case when crypto.randomUUID()
	// is a pre-existing database
	const { data, error } = await supabase
		.from<definitions['rooms']>('rooms')
		.insert([{ id: crypto.randomUUID() }]);
	if (data === null) {
		return {
			status: 500,
			body: error
		};
	}
	return {
		status: 303,
		headers: {
			location: `/room/${data![0]['id']}`
		}
	};
}
