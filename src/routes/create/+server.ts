import { redirect } from '@sveltejs/kit';

const adminCookie = (room: string) => `wuzursched_admin_${room}`;

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals: { supabase }, cookies, url }) {
	// TODO: Manage the rare case when crypto.randomUUID()
	// is a pre-existing database
	const id = crypto.randomUUID();
	const token = `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
	const error = (await supabase.rpc('create_room_with_admin', { p_id: id, p_token: token })).error;
	if (error !== null) {
		throw error;
	}
	cookies.set(adminCookie(id), token, {
		path: `/room/${id}`,
		httpOnly: true,
		sameSite: 'strict',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 365
	});
	throw redirect(303, `/room/${id}`);
}
