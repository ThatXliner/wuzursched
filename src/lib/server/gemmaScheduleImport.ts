import { IMPORT_PERIODS, type ImportPeriod, type ScheduleCandidate } from '../scheduleImport.ts';

const GEMINI_API_ROOT = 'https://generativelanguage.googleapis.com/v1beta/models';

export const DEFAULT_GEMMA_MODEL = 'gemma-4-26b-a4b-it';

export const SCHEDULE_EXTRACTION_PROMPT = `Read this student schedule screenshot and extract every visible class row.

Rules:
- Return only periods 1A, 2A, 3A, 4A, 1B, 2B, 3B, and 4B.
- Preserve the visible class name.
- Split the teacher into first name or title and last name.
- Supported titles include Mr, Mrs, Ms, Mx, Dr, and Coach.
- Use an empty string for a teacher field that is not visible.
- Do not invent missing rows or text.
- If the screenshot contains multiple schedules, extract only the primary student schedule.`;

const responseSchema = {
	type: 'ARRAY',
	items: {
		type: 'OBJECT',
		properties: {
			period: {
				type: 'STRING',
				enum: IMPORT_PERIODS,
				description: 'The normalized A/B schedule period.'
			},
			className: {
				type: 'STRING',
				description: 'The class or course name visible in this period.'
			},
			teacherFirst: {
				type: 'STRING',
				description: 'The teacher first name or supported title, without a trailing period.'
			},
			teacherLast: {
				type: 'STRING',
				description: 'The teacher last name.'
			}
		},
		required: ['period', 'className', 'teacherFirst', 'teacherLast'],
		propertyOrdering: ['period', 'className', 'teacherFirst', 'teacherLast']
	}
} as const;

type GeminiResponse = {
	candidates?: Array<{
		content?: {
			parts?: Array<{ text?: string }>;
		};
	}>;
	error?: { message?: string };
};

export class GemmaScheduleImportError extends Error {
	readonly kind: 'configuration' | 'upstream' | 'invalid-output';

	constructor(message: string, kind: 'configuration' | 'upstream' | 'invalid-output') {
		super(message);
		this.name = 'GemmaScheduleImportError';
		this.kind = kind;
	}
}

function clean(value: string) {
	return value.replace(/\s+/g, ' ').trim();
}

/** Treat model output as untrusted input and reduce it to the app's schedule domain. */
export function validateGemmaScheduleRows(value: unknown): ScheduleCandidate[] {
	if (!Array.isArray(value)) {
		throw new GemmaScheduleImportError('Gemma returned an invalid schedule.', 'invalid-output');
	}

	const rows = new Map<ImportPeriod, ScheduleCandidate>();
	for (const item of value) {
		if (typeof item !== 'object' || item === null) {
			throw new GemmaScheduleImportError(
				'Gemma returned an invalid schedule row.',
				'invalid-output'
			);
		}
		const record = item as Record<string, unknown>;
		if (
			typeof record.period !== 'string' ||
			typeof record.className !== 'string' ||
			typeof record.teacherFirst !== 'string' ||
			typeof record.teacherLast !== 'string'
		) {
			throw new GemmaScheduleImportError(
				'Gemma returned an incomplete schedule row.',
				'invalid-output'
			);
		}

		const period = record.period.toLowerCase() as ImportPeriod;
		const className = clean(record.className);
		if (!IMPORT_PERIODS.includes(period) || !className) {
			throw new GemmaScheduleImportError(
				'Gemma returned an unsupported schedule row.',
				'invalid-output'
			);
		}

		rows.set(period, {
			period,
			className,
			teacherFirst: clean(record.teacherFirst).replace(/\.$/, ''),
			teacherLast: clean(record.teacherLast)
		});
	}

	return IMPORT_PERIODS.flatMap((period) => {
		const row = rows.get(period);
		return row ? [row] : [];
	});
}

export async function extractScheduleWithGemma({
	apiKey,
	model = DEFAULT_GEMMA_MODEL,
	image,
	fetcher = fetch
}: {
	apiKey: string;
	model?: string;
	image: Pick<File, 'type' | 'arrayBuffer'>;
	fetcher?: typeof fetch;
}): Promise<ScheduleCandidate[]> {
	if (!apiKey) {
		throw new GemmaScheduleImportError('Gemma schedule import is not configured.', 'configuration');
	}

	const bytes = new Uint8Array(await image.arrayBuffer());
	const response = await fetcher(
		`${GEMINI_API_ROOT}/${encodeURIComponent(model)}:generateContent`,
		{
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				'x-goog-api-key': apiKey
			},
			body: JSON.stringify({
				contents: [
					{
						role: 'user',
						parts: [
							{ inlineData: { mimeType: image.type, data: Buffer.from(bytes).toString('base64') } },
							{ text: SCHEDULE_EXTRACTION_PROMPT }
						]
					}
				],
				generationConfig: {
					thinkingConfig: { thinkingLevel: 'minimal' },
					responseMimeType: 'application/json',
					responseSchema,
					temperature: 0
				}
			})
		}
	);

	let payload: GeminiResponse;
	try {
		payload = (await response.json()) as GeminiResponse;
	} catch {
		throw new GemmaScheduleImportError('Gemma returned an unreadable response.', 'upstream');
	}

	if (!response.ok) {
		throw new GemmaScheduleImportError(
			payload.error?.message || 'Gemma could not process this image.',
			'upstream'
		);
	}

	const text = payload.candidates?.[0]?.content?.parts
		?.map((part) => part.text ?? '')
		.join('')
		.trim();
	if (!text) {
		throw new GemmaScheduleImportError('Gemma did not find a schedule.', 'invalid-output');
	}

	try {
		return validateGemmaScheduleRows(JSON.parse(text));
	} catch (error) {
		if (error instanceof GemmaScheduleImportError) throw error;
		throw new GemmaScheduleImportError('Gemma returned invalid JSON.', 'invalid-output');
	}
}
