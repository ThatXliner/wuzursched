export type DatabaseChange<T> =
	| { eventType: 'INSERT'; new: T; old: Partial<T> }
	| { eventType: 'UPDATE'; new: T; old: Partial<T> }
	| { eventType: 'DELETE'; new: Partial<T>; old: Partial<T> };

type KeyOf<T> = (row: Partial<T>) => string | undefined;

/**
 * Apply a Postgres change to a snapshot without creating duplicate rows.
 * UPDATE removes the old key first because a primary-key column may have changed.
 */
export function applyDatabaseChange<T>(
	rows: readonly T[],
	change: DatabaseChange<T>,
	keyOf: KeyOf<T>
): T[] {
	if (change.eventType === 'DELETE') {
		const oldKey = keyOf(change.old);
		return oldKey === undefined ? [...rows] : rows.filter((row) => keyOf(row) !== oldKey);
	}

	const newKey = keyOf(change.new);
	if (newKey === undefined) return [...rows];

	const oldKey = change.eventType === 'UPDATE' ? keyOf(change.old) : undefined;
	const existingIndex = rows.findIndex((row) => {
		const key = keyOf(row);
		return key === newKey || (oldKey !== undefined && key === oldKey);
	});

	if (existingIndex === -1) return [...rows, change.new];

	const next = [...rows];
	next[existingIndex] = change.new;
	return next.filter((row, index) => {
		if (index === existingIndex) return true;
		const key = keyOf(row);
		return key !== newKey && (oldKey === undefined || key !== oldKey);
	});
}

export function replayDatabaseChanges<T>(
	rows: readonly T[],
	changes: readonly DatabaseChange<T>[],
	keyOf: KeyOf<T>
): T[] {
	return changes.reduce(
		(current, change) => applyDatabaseChange(current, change, keyOf),
		[...rows]
	);
}
