/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param: string) {
	return /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(
		param
	);
}
