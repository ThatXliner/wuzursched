import { json, type RequestHandler } from '@sveltejs/kit';
import https from 'node:https';
import tls from 'node:tls';

export const prerender = false;
export const config = { maxDuration: 60 };
const urls = [
	'https://dv-g3b-emudhra.we-have-a-problem.com/',
	'https://dv-g3b-aaa-emudhra.we-have-a-problem.com/',
	'https://example.com/'
];
function errorCode(error: unknown): string {
	if (typeof error !== 'object' || error === null) return 'UNKNOWN';
	if ('cause' in error && error.cause) return errorCode(error.cause);
	if ('code' in error && typeof error.code === 'string') return error.code;
	return 'UNKNOWN';
}
const probes = ['fetch', 'https'].flatMap((api) =>
	urls.map((url, index) => ({
		api,
		url,
		key: `${api}-${['direct', 'aaa', 'good'][index]}`
	}))
);
export const GET: RequestHandler = async ({ url: requestUrl }) => {
	const selected = probes.find((probe) => probe.key === requestUrl.searchParams.get('probe'));
	if (!selected) return json({ error: 'Choose one fixed probe' }, { status: 400 });
	const results = await Promise.all(
		[selected].map(async ({ api, url }) => {
			try {
				let status: number | undefined;
				if (api === 'fetch') {
					const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
					status = response.status;
					await response.arrayBuffer();
				} else {
					status = await new Promise<number>((resolve, reject) => {
						const request = https.get(
							url,
							{ family: 4, agent: false, signal: AbortSignal.timeout(15000) },
							(response) => {
								response.resume();
								response.on('end', () => resolve(response.statusCode || 0));
							}
						);
						request.setTimeout(15000, () => request.destroy(new Error('timeout')));
						request.on('error', reject);
					});
				}
				return { api, url, status, result: 'success' };
			} catch (error) {
				return { api, url, errorCode: errorCode(error), result: 'error' };
			}
		})
	);
	return json({
		runtime: process.version,
		helperSourceHash: '8b2228ca14487054d77c477432249757a41bf8ce5ddddcaddb2034bc6589b629',
		rootCount: tls.getCACertificates('default').length,
		results
	});
};
