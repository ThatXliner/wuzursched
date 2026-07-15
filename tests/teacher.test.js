/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- Node runs this TypeScript-importing test directly; the app tsconfig has no Node types.
import assert from 'node:assert/strict';
import test from 'node:test';

import {
	isValidTeacherFirstName,
	isValidTeacherLastName,
	normalizeTeacherIdentity,
	teacherDisplayName,
	teacherSearchText
} from '../src/lib/teacher.ts';

test('normalizes a teacher entered by first name', () => {
	assert.deepEqual(
		normalizeTeacherIdentity({ kind: 'first-name', value: ' Jane ' }, ' Van  Arild '),
		{
			teacher_first: 'jane',
			teacher_last: 'van arild',
			teacher_title: null
		}
	);
});

test('normalizes a teacher entered by title', () => {
	assert.deepEqual(normalizeTeacherIdentity({ kind: 'title', value: 'Ms' }, ' Arild '), {
		teacher_first: null,
		teacher_last: 'arild',
		teacher_title: 'ms'
	});
});

test('canonicalizes a title entered through the old first-name representation', () => {
	assert.deepEqual(normalizeTeacherIdentity({ kind: 'first-name', value: 'Ms' }, 'Arild'), {
		teacher_first: null,
		teacher_last: 'arild',
		teacher_title: 'ms'
	});
});

test('formats old, first-name, and title-based rows naturally', () => {
	assert.equal(
		teacherDisplayName({ teacher_first: 'jane', teacher_last: 'arild', teacher_title: null }),
		'Jane Arild'
	);
	assert.equal(
		teacherDisplayName({ teacher_first: null, teacher_last: 'arild', teacher_title: 'ms' }),
		'Ms Arild'
	);
});

test('includes either identity form in teacher search text', () => {
	assert.equal(
		teacherSearchText({ teacher_first: 'jane', teacher_last: 'arild', teacher_title: null }),
		'jane arild'
	);
	assert.equal(
		teacherSearchText({ teacher_first: null, teacher_last: 'arild', teacher_title: 'ms' }),
		'ms arild'
	);
});

test('validates natural single-word first names and a required last name', () => {
	assert.equal(isValidTeacherFirstName('Anne-Marie'), true);
	assert.equal(isValidTeacherFirstName('Mary Jane'), false);
	assert.equal(isValidTeacherFirstName('Ms'), false);
	assert.equal(isValidTeacherLastName('Van Arild'), true);
	assert.equal(isValidTeacherLastName('   '), false);
});
