import { expect, test } from '@playwright/test';
import {
	formatClassName,
	formatTeacherName,
	normalizeClassName,
	normalizeTeacherName
} from '../src/lib/utils';

test.describe('storage normalization', () => {
	test('keeps the existing class canonicalization behavior', () => {
		expect(normalizeClassName('  AP Biology II  ')).toBe('ap biology 2');
		expect(normalizeClassName('Space & Electricity')).toBe('se');
	});

	test('keeps teacher matching case-insensitive and trimmed', () => {
		expect(normalizeTeacherName("  O'NEILL ")).toBe("o'neill");
	});
});

test.describe('class display formatting', () => {
	test('formats multi-word names, known acronyms, and numerals', () => {
		expect(formatClassName('ap united states history 2')).toBe('AP United States History 2');
		expect(formatClassName('ib english literature iii')).toBe('IB English Literature III');
		expect(formatClassName('pre-ap calculus ab')).toBe('Pre-AP Calculus AB');
		expect(formatClassName('stem lab 2b')).toBe('STEM Lab 2B');
	});

	test('preserves punctuation and formats dotted initialisms', () => {
		expect(formatClassName('u.s. history')).toBe('U.S. History');
		expect(formatClassName('computer-aided design/art')).toBe('Computer-Aided Design/Art');
	});
});

test.describe('teacher display formatting', () => {
	test('formats full names, initials, apostrophes, and hyphens', () => {
		expect(formatTeacherName("j. o'neill-smith")).toBe("J. O'Neill-Smith");
		expect(formatTeacherName('j.r.r. tolkien')).toBe('J.R.R. Tolkien');
	});

	test('formats name particles, suffixes, and common Mc names', () => {
		expect(formatTeacherName('ana de la cruz')).toBe('Ana de la Cruz');
		expect(formatTeacherName('sean mcdonald jr')).toBe('Sean McDonald Jr.');
	});
});
