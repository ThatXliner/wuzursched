import { supabase } from '$lib/db';
import type { definitions } from '$lib/db.d';

/** @type {import('./__types/[room=uuid]').RequestHandler} */
export async function GET({ params }) {
	if (
		(
			(await supabase.from<definitions['rooms']>('rooms').select('*').eq('id', params.room))[
				'data'
			] ?? []
		).length === 0
	) {
		console.log('yo');
		return {
			status: 404
		};
	}
	const { data: schedules, error: schedule_error } = await supabase
		.from<definitions['schedules']>('schedules')
		.select('*')
		.eq('room', params.room);
	// const { data: classes, error: classes_error } = await supabase
	// 	.from<definitions['classes']>('classes')
	// 	.select('*')
	// 	.eq('id', params.room);

	if (schedules === null) {
		return {
			status: 500,
			body: schedule_error
		};
	}
	// if (classes === null) {
	// 	return {
	// 		status: 500,
	// 		body: classes_error
	// 	};
	// }
	return {
		status: 200,
		headers: {},
		body: { schedules }
	};
}
