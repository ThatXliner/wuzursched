import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/db';
import type { definitions } from '$lib/db.d';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	// TODO: Manage the rare case when crypto.randomUUID()
	// is a pre-existing database
	const { data, error } = await supabase
		.from('rooms')
		.insert([{ id: crypto.randomUUID() }]);
	if (data === null) {
		throw error;
	}
	throw redirect(303, `/room/${data![0]['id']}`);
}
