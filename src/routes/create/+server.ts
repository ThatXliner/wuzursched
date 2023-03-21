import { redirect } from '@sveltejs/kit';
import { supabase } from '$lib/db';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	// TODO: Manage the rare case when crypto.randomUUID()
	// is a pre-existing database
	const id = crypto.randomUUID();
	const error = (await supabase.from('rooms').insert([{ id }])).error;
	if (error !== null) {
		throw error;
	}
	throw redirect(303, `/room/${id}`);
}
