import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

type FlyAndScaleParams = {
	y?: number;
	x?: number;
	start?: number;
	duration?: number;
};

export const flyAndScale = (
	node: Element,
	params: FlyAndScaleParams = { y: -8, x: 0, start: 0.95, duration: 150 }
): TransitionConfig => {
	const style = getComputedStyle(node);
	const transform = style.transform === 'none' ? '' : style.transform;

	const scaleConversion = (valueA: number, scaleA: [number, number], scaleB: [number, number]) => {
		const [minA, maxA] = scaleA;
		const [minB, maxB] = scaleB;

		const percentage = (valueA - minA) / (maxA - minA);
		const valueB = percentage * (maxB - minB) + minB;

		return valueB;
	};

	const styleToString = (style: Record<string, number | string | undefined>): string => {
		return Object.keys(style).reduce((str, key) => {
			if (style[key] === undefined) return str;
			return str + `${key}:${style[key]};`;
		}, '');
	};

	return {
		duration: params.duration ?? 200,
		delay: 0,
		css: (t) => {
			const y = scaleConversion(t, [0, 1], [params.y ?? 5, 0]);
			const x = scaleConversion(t, [0, 1], [params.x ?? 0, 0]);
			const scale = scaleConversion(t, [0, 1], [params.start ?? 0.95, 1]);

			return styleToString({
				transform: `${transform} translate3d(${x}px, ${y}px, 0) scale(${scale})`,
				opacity: t
			});
		},
		easing: cubicOut
	};
};

const CLASS_ACRONYMS = new Set([
	'ab',
	'ap',
	'avid',
	'bc',
	'cte',
	'da',
	'ela',
	'esl',
	'hl',
	'ib',
	'pe',
	'se',
	'sl',
	'stem',
	'us'
]);

const ROMAN_NUMERAL = /^(?=[ivxlcdm]+$)m{0,4}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i;
const DOTTED_INITIALISM = /^(?:[a-z]\.){2,}$/i;

function capitalizeWord(word: string) {
	return word.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase());
}

function formatClassSegment(segment: string) {
	return CLASS_ACRONYMS.has(segment) ? segment.toLocaleUpperCase() : capitalizeWord(segment);
}

function formatClassWord(word: string) {
	const lower = word.toLocaleLowerCase();

	if (CLASS_ACRONYMS.has(lower)) return lower.toLocaleUpperCase();
	if (DOTTED_INITIALISM.test(lower)) return lower.toLocaleUpperCase();
	if (ROMAN_NUMERAL.test(lower)) return lower.toLocaleUpperCase();
	if (/^\d+[a-z]$/i.test(lower)) {
		return lower.slice(0, -1) + lower.at(-1)?.toLocaleUpperCase();
	}

	return lower
		.split(/([-–—/])/)
		.map((part) => (/[-–—/]/.test(part) ? part : formatClassSegment(part)))
		.join('');
}

/** Format a canonical class name for display without changing the stored value. */
export function formatClassName(className: string) {
	return className.trim().replace(/\s+/g, ' ').split(' ').map(formatClassWord).join(' ');
}

function formatNamePart(part: string, index: number) {
	const lower = part.toLocaleLowerCase();

	if (/^[a-z]\.?$/i.test(lower))
		return lower[0].toLocaleUpperCase() + (lower.endsWith('.') ? '.' : '');
	if (DOTTED_INITIALISM.test(lower) || ROMAN_NUMERAL.test(lower)) return lower.toLocaleUpperCase();
	if (index > 0 && /^(da|de|del|der|di|la|le|van|von)$/i.test(lower)) return lower;

	return lower
		.split(/([-'’])/)
		.map((segment) => (/[-'’]/.test(segment) ? segment : capitalizeWord(segment)))
		.join('')
		.replace(/^Mc(\p{L})/u, (_, letter: string) => `Mc${letter.toLocaleUpperCase()}`)
		.replace(/^(Jr|Sr)$/u, '$1.');
}

/** Format a canonical teacher name for display without changing the stored value. */
export function formatTeacherName(name: string) {
	return name.trim().replace(/\s+/g, ' ').split(' ').map(formatNamePart).join(' ');
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
export function normalizeClassName(className: string) {
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

/** Preserve the existing teacher storage/search/uniqueness semantics. */
export function normalizeTeacherName(name: string) {
	return name.trim().toLocaleLowerCase();
}

export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
	? ElementType
	: never;
function* setMinus<T>(A: Iterable<T>, B: Iterable<T>) {
	const setA = new Set(A);
	const setB = new Set(B);

	for (const v of setB.values()) {
		if (!setA.delete(v)) {
			yield v;
		}
	}

	for (const v of setA.values()) {
		yield v;
	}
}
export function setDifference<T>(A: Iterable<T>, B: Iterable<T>): Set<T> {
	return new Set([...setMinus(A, B)]);
}
