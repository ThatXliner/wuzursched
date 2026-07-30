import { env } from '$env/dynamic/private';
import {
	DEFAULT_GEMINI_MODEL,
	extractScheduleWithGemini,
	GeminiScheduleImportError
} from '$lib/server/geminiScheduleImport';
import { MAX_SCHEDULE_IMAGE_SIZE, validateScheduleImage } from '$lib/scheduleImport';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 5;
const attempts = new Map<string, number[]>();

function isRateLimited(address: string, now = Date.now()) {
	const recent = (attempts.get(address) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
	if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
		attempts.set(address, recent);
		return true;
	}
	recent.push(now);
	attempts.set(address, recent);
	return false;
}

export const POST: RequestHandler = async ({ request, getClientAddress, fetch }) => {
	if (!env.GEMINI_API_KEY) {
		return json(
			{ error: 'Screenshot import is not configured on this deployment.' },
			{ status: 503, headers: { 'cache-control': 'no-store' } }
		);
	}

	if (isRateLimited(getClientAddress())) {
		return json(
			{ error: 'Too many screenshot imports. Please wait a few minutes and try again.' },
			{ status: 429, headers: { 'cache-control': 'no-store', 'retry-after': '600' } }
		);
	}

	const contentLength = Number(request.headers.get('content-length'));
	if (Number.isFinite(contentLength) && contentLength > MAX_SCHEDULE_IMAGE_SIZE + 1024 * 1024) {
		return json(
			{ error: 'The image must be 10 MB or smaller.' },
			{ status: 413, headers: { 'cache-control': 'no-store' } }
		);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json(
			{ error: 'Upload a PNG, JPEG, or WebP schedule image.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	const image = form.get('image');
	if (!(image instanceof File)) {
		return json(
			{ error: 'Upload a PNG, JPEG, or WebP schedule image.' },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}
	const validationError = validateScheduleImage(image);
	if (validationError) {
		return json(
			{ error: validationError },
			{ status: 400, headers: { 'cache-control': 'no-store' } }
		);
	}

	try {
		const rows = await extractScheduleWithGemini({
			apiKey: env.GEMINI_API_KEY,
			model: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
			image,
			fetcher: fetch
		});
		return json({ rows }, { headers: { 'cache-control': 'no-store' } });
	} catch (error) {
		console.error('Gemini schedule import failed', error);
		const status =
			error instanceof GeminiScheduleImportError && error.kind === 'invalid-output' ? 422 : 502;
		return json(
			{
				error:
					status === 422
						? 'We could not find a usable schedule in that image. Try a clearer screenshot.'
						: 'The schedule-reading service is temporarily unavailable.'
			},
			{ status, headers: { 'cache-control': 'no-store' } }
		);
	}
};
