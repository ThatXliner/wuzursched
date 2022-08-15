/** @type {import('./__types/items').RequestHandler} */
export async function GET() {
	return {
		status: 303,
		headers: {
			location: `/`
		}
	};
}
