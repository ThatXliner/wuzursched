/** @type {import('./$types').RequestHandler} */
export async function GET() {
	return new Response(undefined, {
		status: 303,
		headers: {
			location: '/'
		}
	});
}
