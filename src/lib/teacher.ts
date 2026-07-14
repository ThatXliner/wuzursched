export const TEACHER_TITLES = ['Mr', 'Mrs', 'Ms', 'Mx', 'Dr', 'Coach'] as const;

export type TeacherTitle = (typeof TEACHER_TITLES)[number];

export type TeacherIdentityInput =
	{ kind: 'first-name'; value: string } | { kind: 'title'; value: TeacherTitle };

export type TeacherIdentity = {
	teacher_first: string | null;
	teacher_last: string;
	teacher_title: string | null;
};

const SINGLE_NAME_PART = /^[\p{L}\p{M}.'’-]+$/u;

export function isTeacherTitle(value: string): value is TeacherTitle {
	return TEACHER_TITLES.some((title) => title.toLowerCase() === value.trim().toLowerCase());
}

export function isValidTeacherFirstName(value: string) {
	return SINGLE_NAME_PART.test(value.trim()) && !isTeacherTitle(value);
}

export function isValidTeacherLastName(value: string) {
	return value.trim().length > 0;
}

export function normalizeTeacherIdentity(
	identity: TeacherIdentityInput,
	lastName: string
): TeacherIdentity {
	const enteredAsTitle = identity.kind === 'title' || isTeacherTitle(identity.value);

	return {
		teacher_first: enteredAsTitle ? null : identity.value.trim().toLowerCase(),
		teacher_last: lastName.trim().replace(/\s+/g, ' ').toLowerCase(),
		teacher_title: enteredAsTitle ? identity.value.trim().toLowerCase() : null
	};
}

function titlecase(value: string) {
	return value ? value[0].toUpperCase() + value.slice(1) : '';
}

export function teacherDisplayName(teacher: TeacherIdentity) {
	const firstOrTitle = teacher.teacher_first ?? teacher.teacher_title ?? '';
	return `${titlecase(firstOrTitle)} ${titlecase(teacher.teacher_last)}`.trim();
}

export function teacherSearchText(teacher: TeacherIdentity) {
	return [teacher.teacher_first, teacher.teacher_title, teacher.teacher_last]
		.filter((part): part is string => Boolean(part))
		.join(' ');
}
