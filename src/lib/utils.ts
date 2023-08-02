export function titlecase(x: string) {
	return x[0].toUpperCase() + x.slice(1);
}
export function sqlEscape(str: string) {
	// this better work well
	// eslint-disable-next-line no-control-regex
	return str.replace(/[\0\x08\x09\x1a\n\r"'\\%]/g, function (char: string) {
		switch (char) {
			case '\0':
				return '\\0';
			case '\x08':
				return '\\b';
			case '\x09':
				return '\\t';
			case '\x1a':
				return '\\z';
			case '\n':
				return '\\n';
			case '\r':
				return '\\r';
			case '"':
			case "'":
			case '\\':
			case '%':
				return '\\' + char; // prepends a backslash to backslash, percent,
			// and double/single quotes
			default:
				return char;
		}
	});
}
export function normalize(className: string) {
	return (
		className
			.toLowerCase()
			.trim()
			// Space & Electricity -> SE
			.replace(/(\w+)\s*&\s*(\w+)$/, (_, p1: string, p2: string) => p1[0] + p2[0])
			.replace(/ iii$/, ' 3')
			.replace(/ ii$/, ' 2')
			.replace(/ i$/, ' 1')
			.replace(/\s+/, ' ')
	);
}
export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
	? ElementType
	: never;
