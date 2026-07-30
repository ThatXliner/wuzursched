import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	extractScheduleCandidates,
	matchCandidate,
	toUnfinishedSchedule,
	validateScheduleImage
} from '../src/lib/scheduleImport.ts';
import {
	extractScheduleWithGemini,
	GeminiScheduleImportError,
	validateGeminiScheduleRows
} from '../src/lib/server/geminiScheduleImport.ts';

const fixtures = new URL('./fixtures/schedule-import/', import.meta.url);

describe('schedule import', () => {
	it('extracts all periods, classes, and teachers from a standard layout', async () => {
		const rows = extractScheduleCandidates(
			await readFile(new URL('standard.txt', fixtures), 'utf8')
		);
		assert.equal(rows.length, 8);
		assert.deepEqual(rows[0], {
			period: '1a',
			className: 'AP Biology',
			teacherFirst: 'Jane',
			teacherLast: 'Smith'
		});
		assert.deepEqual(rows[7], {
			period: '4b',
			className: 'PE',
			teacherFirst: 'Casey',
			teacherLast: 'Jones'
		});
	});

	it('handles OCR-like and multiline ambiguous text', async () => {
		const rows = extractScheduleCandidates(
			await readFile(new URL('ambiguous.txt', fixtures), 'utf8')
		);
		assert.deepEqual(
			rows.map((row) => row.period),
			['1a', '2a', '3b', '4b']
		);
		assert.equal(rows.at(-1)?.className, 'Physical Education');
	});

	it('auto-selects only high-confidence room matches', () => {
		const classes = [
			{
				id: 'biology',
				name: 'ap biology',
				teacher_first: 'jane',
				teacher_last: 'smith',
				teacher_title: null,
				room: 'room'
			}
		];
		assert.equal(
			matchCandidate(
				{ period: '1a', className: 'AP Biology', teacherFirst: 'Jane', teacherLast: 'Smith' },
				classes
			).status,
			'high'
		);
		assert.equal(
			matchCandidate(
				{ period: '1a', className: 'AP Bio', teacherFirst: 'J', teacherLast: 'Smith' },
				classes
			).status,
			'uncertain'
		);
		assert.equal(
			matchCandidate(
				{ period: '1a', className: 'Ceramics', teacherFirst: 'A', teacherLast: 'Lee' },
				classes
			).status,
			'none'
		);
	});

	it('preserves a teacher title as the imported identity', () => {
		assert.deepEqual(extractScheduleCandidates('1A | Biology | Dr. Smith')[0], {
			period: '1a',
			className: 'Biology',
			teacherFirst: 'Dr',
			teacherLast: 'Smith'
		});
	});

	it('maps confirmed rows into the normal schedule form shape', () => {
		assert.deepEqual(
			toUnfinishedSchedule([
				{ period: '1a', classId: 'class-1' },
				{ period: '2b', classId: 'class-2' }
			]),
			{ '1a': 'class-1', '2b': 'class-2' }
		);
	});

	it('rejects unsupported and oversized image uploads', () => {
		assert.match(validateScheduleImage({ type: 'application/pdf', size: 1 }), /PNG/);
		assert.match(validateScheduleImage({ type: 'image/png', size: 10 * 1024 * 1024 + 1 }), /10 MB/);
		assert.equal(validateScheduleImage({ type: 'image/jpeg', size: 10 * 1024 * 1024 }), '');
	});

	it('validates, normalizes, de-duplicates, and orders Gemini rows', () => {
		assert.deepEqual(
			validateGeminiScheduleRows([
				{
					period: '2B',
					className: '  English   10 ',
					teacherFirst: 'Dr.',
					teacherLast: ' Lee '
				},
				{
					period: '1a',
					className: 'Biology',
					teacherFirst: 'Jane',
					teacherLast: 'Smith'
				},
				{
					period: '1A',
					className: 'AP Biology',
					teacherFirst: 'Jane',
					teacherLast: 'Smith'
				}
			]),
			[
				{
					period: '1a',
					className: 'AP Biology',
					teacherFirst: 'Jane',
					teacherLast: 'Smith'
				},
				{
					period: '2b',
					className: 'English 10',
					teacherFirst: 'Dr',
					teacherLast: 'Lee'
				}
			]
		);
	});

	it('rejects semantically invalid Gemini rows', () => {
		assert.throws(
			() =>
				validateGeminiScheduleRows([
					{ period: '5a', className: 'Biology', teacherFirst: 'Jane', teacherLast: 'Smith' }
				]),
			GeminiScheduleImportError
		);
	});

	it('sends the image to Gemini and validates its structured response', async () => {
		let request: { url: string; init?: RequestInit } | undefined;
		const rows = await extractScheduleWithGemini({
			apiKey: 'server-secret',
			image: {
				type: 'image/png',
				arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer
			},
			fetcher: async (input, init) => {
				request = { url: String(input), init };
				return Response.json({
					candidates: [
						{
							content: {
								parts: [
									{
										text: JSON.stringify([
											{
												period: '1a',
												className: 'Biology',
												teacherFirst: 'Jane',
												teacherLast: 'Smith'
											}
										])
									}
								]
							}
						}
					]
				});
			}
		});

		assert.equal(request?.url.endsWith(':generateContent'), true);
		assert.equal(request?.url.includes('/gemini-3.6-flash:'), true);
		assert.equal(new Headers(request?.init?.headers).get('x-goog-api-key'), 'server-secret');
		assert.equal(request?.url.includes('server-secret'), false);
		assert.deepEqual(
			rows.map((row) => row.period),
			['1a']
		);
		const body = JSON.parse(String(request?.init?.body));
		assert.equal(body.contents[0].parts[0].inlineData.data, 'AQID');
		assert.equal(body.generationConfig.responseMimeType, 'application/json');
	});
});
