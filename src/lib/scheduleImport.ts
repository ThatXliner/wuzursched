import type { UnfinishedSchedule } from './schedule';
import type { Database } from './supabase';
import { teacherSearchText } from './teacher.ts';

type Class = Database['public']['Tables']['classes']['Row'];

export const IMPORT_PERIODS = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;
export type ImportPeriod = (typeof IMPORT_PERIODS)[number];

export type ScheduleCandidate = {
	period: ImportPeriod;
	className: string;
	teacherFirst: string;
	teacherLast: string;
};

export type ClassMatch = {
	classId: string | null;
	confidence: number;
	status: 'high' | 'uncertain' | 'none';
};

export const MAX_SCHEDULE_IMAGE_SIZE = 10 * 1024 * 1024;
export const SCHEDULE_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export function validateScheduleImage(file: Pick<File, 'type' | 'size'>) {
	if (!SCHEDULE_IMAGE_TYPES.has(file.type)) return 'Choose a PNG, JPEG, or WebP image.';
	if (file.size > MAX_SCHEDULE_IMAGE_SIZE) return 'The image must be 10 MB or smaller.';
	return '';
}

const PERIOD_PATTERN = /(?:period\s*)?([1-4])\s*([ab])\b/i;

function clean(value: string) {
	return value
		.replace(/^[\s|,:;\-–—]+|[\s|,:;\-–—]+$/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function splitTeacher(value: string): Pick<ScheduleCandidate, 'teacherFirst' | 'teacherLast'> {
	const teacher = clean(value.replace(/^(?:teacher|instructor)\s*:?\s*/i, ''));
	if (!teacher) return { teacherFirst: '', teacherLast: '' };
	const titleMatch = teacher.match(/^(mr|mrs|ms|mx|dr|coach)\.?\s+(.+)$/i);
	if (titleMatch) return { teacherFirst: titleMatch[1], teacherLast: clean(titleMatch[2]) };
	if (teacher.includes(',')) {
		const [last, ...first] = teacher.split(',');
		return { teacherFirst: clean(first.join(' ')), teacherLast: clean(last) };
	}
	const parts = teacher.split(/\s+/);
	if (parts.length === 1) return { teacherFirst: '', teacherLast: parts[0] };
	return { teacherFirst: parts.slice(0, -1).join(' '), teacherLast: parts.at(-1)! };
}

function parseDetails(value: string) {
	const normalized = clean(value.replace(/^[:|\-–—]+/, ''));
	const parts = normalized
		.split(/\s*(?:\||\t|\s[-–—]\s|\s{2,})\s*/)
		.map(clean)
		.filter(Boolean);
	let className = parts[0] ?? '';
	let teacher = parts.slice(1).join(' ');
	if (!teacher) {
		const teacherMatch = className.match(/^(.*?)\s+(?:teacher|instructor)\s*:?\s*(.+)$/i);
		if (teacherMatch) {
			className = clean(teacherMatch[1]);
			teacher = clean(teacherMatch[2]);
		}
	}
	return { className, ...splitTeacher(teacher) };
}

/** Extracts schedule rows from OCR output or pasted text without retaining the source image. */
export function extractScheduleCandidates(text: string): ScheduleCandidate[] {
	const candidates = new Map<ImportPeriod, ScheduleCandidate>();
	const lines = text
		.replace(/\r/g, '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean);

	for (let index = 0; index < lines.length; index += 1) {
		const match = lines[index].match(PERIOD_PATTERN);
		if (!match) continue;
		const period = `${match[1]}${match[2].toLowerCase()}` as ImportPeriod;
		let details = clean(lines[index].slice((match.index ?? 0) + match[0].length));
		if (!details && lines[index + 1] && !PERIOD_PATTERN.test(lines[index + 1])) {
			details = lines[++index];
		}
		const parsed = parseDetails(details);
		if (parsed.className) candidates.set(period, { period, ...parsed });
	}

	return IMPORT_PERIODS.flatMap((period) => {
		const candidate = candidates.get(period);
		return candidate ? [candidate] : [];
	});
}

function comparable(value: string) {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

function levenshtein(left: string, right: string) {
	const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
	for (let i = 1; i <= left.length; i += 1) {
		let diagonal = previous[0];
		previous[0] = i;
		for (let j = 1; j <= right.length; j += 1) {
			const above = previous[j];
			previous[j] = Math.min(
				previous[j] + 1,
				previous[j - 1] + 1,
				diagonal + (left[i - 1] === right[j - 1] ? 0 : 1)
			);
			diagonal = above;
		}
	}
	return previous[right.length];
}

function similarity(left: string, right: string) {
	const a = comparable(left);
	const b = comparable(right);
	if (!a || !b) return 0;
	if (a === b) return 1;
	return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
}

export function matchCandidate(candidate: ScheduleCandidate, classes: Class[]): ClassMatch {
	let best: { id: string; score: number } | null = null;
	for (const klass of classes) {
		const classScore = similarity(candidate.className, klass.name);
		const candidateTeacher = `${candidate.teacherFirst} ${candidate.teacherLast}`.trim();
		const classTeacher = teacherSearchText(klass);
		const teacherScore = candidateTeacher ? similarity(candidateTeacher, classTeacher) : classScore;
		const score = classScore * 0.72 + teacherScore * 0.28;
		if (!best || score > best.score) best = { id: klass.id, score };
	}
	if (!best || best.score < 0.5)
		return { classId: null, confidence: best?.score ?? 0, status: 'none' };
	if (best.score < 0.82) return { classId: best.id, confidence: best.score, status: 'uncertain' };
	return { classId: best.id, confidence: best.score, status: 'high' };
}

export function toUnfinishedSchedule(rows: Array<{ period: ImportPeriod; classId: string }>) {
	return Object.fromEntries(
		rows.map(({ period, classId }) => [period, classId])
	) as UnfinishedSchedule;
}
