import { error as returnError, fail, redirect, type Actions, type ServerLoad } from '@sveltejs/kit';

const adminCookie = (room: string) => `wuzursched_admin_${room}`;

function newAdminToken() {
	return `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;
}

function cookieOptions(room: string, secure: boolean) {
	return {
		path: `/room/${room}`,
		httpOnly: true,
		sameSite: 'strict' as const,
		secure,
		maxAge: 60 * 60 * 24 * 365
	};
}

function parseCsv(source: string) {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let quoted = false;
	for (let i = 0; i <= source.length; i += 1) {
		const char = source[i] ?? '\n';
		if (char === '"') {
			if (quoted && source[i + 1] === '"') {
				field += '"';
				i += 1;
			} else quoted = !quoted;
		} else if (char === ',' && !quoted) {
			row.push(field.trim());
			field = '';
		} else if ((char === '\n' || char === '\r') && !quoted) {
			if (char === '\r' && source[i + 1] === '\n') i += 1;
			row.push(field.trim());
			if (row.some(Boolean)) rows.push(row);
			row = [];
			field = '';
		} else field += char;
	}
	if (quoted) throw new Error('The class list contains an unclosed quote.');
	if (
		rows[0]?.map((value) => value.toLowerCase()).join(',') === 'name,teacher_first,teacher_last'
	) {
		rows.shift();
	}
	return rows.map(([name, teacher_first, teacher_last], index) => {
		if (!name || !teacher_first || !teacher_last) {
			throw new Error(
				`Class list row ${index + 1} needs name, teacher first name, and teacher last name.`
			);
		}
		return { name, teacher_first, teacher_last };
	});
}

async function requireToken(
	room: string,
	cookies: Parameters<Actions[string]>[0]['cookies'],
	supabase: Parameters<Actions[string]>[0]['locals']['supabase']
) {
	const token = cookies.get(adminCookie(room));
	if (!token) return null;
	const { data, error } = await supabase.rpc('verify_room_admin', {
		p_room: room,
		p_token: token
	});
	return !error && data ? token : null;
}

export const load: ServerLoad = async ({ params, cookies, locals: { supabase } }) => {
	const room = params.room!;
	const roomResult = await supabase
		.from('rooms')
		.select('id, announcement, allow_class_creation, class_name_format, teacher_name_format')
		.eq('id', room)
		.single();
	if (roomResult.error?.code === 'PGRST116') {
		throw returnError(404, 'Room does not exist');
	}
	if (roomResult.error) throw roomResult.error;
	// Surely not a N+1
	const [{ data, error }, classesResult, auditResult, token] = await Promise.all([
		supabase.from('schedules').select('*').eq('room', room),
		supabase.from('classes').select('*').eq('room', room),
		supabase
			.from('room_audit_log')
			.select('*')
			.eq('room', room)
			.order('created_at', { ascending: false })
			.limit(100),
		requireToken(room, cookies, supabase)
	]);

	if (error) throw error;
	if (classesResult.error) throw classesResult.error;
	if (auditResult.error) throw auditResult.error;
	return {
		data,
		classes: classesResult.data,
		roomConfig: roomResult.data,
		auditLog: auditResult.data,
		isAdmin: token !== null
	};
};

export const actions: Actions = {
	login: async ({ params, request, cookies, url, locals: { supabase } }) => {
		const room = params.room!;
		const token = String((await request.formData()).get('token') ?? '').trim();
		const { data } = await supabase.rpc('verify_room_admin', { p_room: room, p_token: token });
		if (!data) return fail(403, { message: 'That admin credential is invalid.' });
		cookies.set(adminCookie(room), token, cookieOptions(room, url.protocol === 'https:'));
		throw redirect(303, url.pathname);
	},
	logout: async ({ params, cookies, url }) => {
		cookies.delete(adminCookie(params.room!), { path: `/room/${params.room}` });
		throw redirect(303, url.pathname);
	},
	settings: async ({ params, request, cookies, locals: { supabase } }) => {
		const room = params.room!;
		const token = await requireToken(room, cookies, supabase);
		if (!token) return fail(403, { message: 'Admin authorization required.' });
		const form = await request.formData();
		const { error } = await supabase.rpc('admin_update_room', {
			p_room: room,
			p_token: token,
			p_announcement: String(form.get('announcement') ?? ''),
			p_allow_class_creation: form.get('allow_class_creation') === 'on',
			p_class_name_format: String(form.get('class_name_format') ?? 'normalized'),
			p_teacher_name_format: String(form.get('teacher_name_format') ?? 'title')
		});
		if (error) return fail(400, { message: error.message });
		return { message: 'Room settings saved.' };
	},
	seed: async ({ params, request, cookies, locals: { supabase } }) => {
		const room = params.room!;
		const token = await requireToken(room, cookies, supabase);
		if (!token) return fail(403, { message: 'Admin authorization required.' });
		const form = await request.formData();
		const uploaded = form.get('class_file');
		let source = String(form.get('class_list') ?? '');
		if (uploaded instanceof File && uploaded.size > 0) source = await uploaded.text();
		try {
			const classes = parseCsv(source);
			if (classes.length === 0) return fail(400, { message: 'Add at least one class.' });
			const { error } = await supabase.rpc('admin_seed_classes', {
				p_room: room,
				p_token: token,
				p_classes: classes
			});
			if (error) return fail(400, { message: error.message });
			return { message: `${classes.length} classes imported.` };
		} catch (error) {
			return fail(400, { message: error instanceof Error ? error.message : 'Invalid class list.' });
		}
	},
	updateSchedule: async ({ params, request, cookies, locals: { supabase } }) => {
		const room = params.room!;
		const token = await requireToken(room, cookies, supabase);
		if (!token) return fail(403, { message: 'Admin authorization required.' });
		const form = await request.formData();
		const student = String(form.get('original_student') ?? '');
		const schedule = Object.fromEntries(
			['student', '1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'].map((key) => [
				key,
				String(form.get(key) ?? '')
			])
		);
		const { error } = await supabase.rpc('admin_update_schedule', {
			p_room: room,
			p_token: token,
			p_student: student,
			p_schedule: schedule
		});
		if (error) return fail(400, { message: error.message });
		return { message: `${schedule.student}'s schedule updated.` };
	},
	deleteSchedule: async ({ params, request, cookies, locals: { supabase } }) => {
		const room = params.room!;
		const token = await requireToken(room, cookies, supabase);
		if (!token) return fail(403, { message: 'Admin authorization required.' });
		const student = String((await request.formData()).get('student') ?? '');
		const { error } = await supabase.rpc('admin_delete_schedule', {
			p_room: room,
			p_token: token,
			p_student: student
		});
		if (error) return fail(400, { message: error.message });
		return { message: `${student}'s schedule deleted.` };
	},
	rotate: async ({ params, cookies, url, locals: { supabase } }) => {
		const room = params.room!;
		const token = await requireToken(room, cookies, supabase);
		if (!token) return fail(403, { message: 'Admin authorization required.' });
		const transferToken = newAdminToken();
		const { error } = await supabase.rpc('admin_rotate_token', {
			p_room: room,
			p_token: token,
			p_new_token: transferToken
		});
		if (error) return fail(400, { message: error.message });
		cookies.set(adminCookie(room), transferToken, cookieOptions(room, url.protocol === 'https:'));
		return { message: 'Credential rotated. The previous credential is revoked.', transferToken };
	}
};
