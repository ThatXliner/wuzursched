import { expect, test } from '@playwright/test';
import { applyDatabaseChange, replayDatabaseChanges } from '../src/lib/realtime';

type Row = { id: string; value: string };
const keyOf = (row: Partial<Row>) => row.id;

test('database changes are applied without duplicate rows', () => {
	const original = [{ id: 'one', value: 'old' }];
	const inserted = applyDatabaseChange(
		original,
		{ eventType: 'INSERT', new: { id: 'one', value: 'new' }, old: {} },
		keyOf
	);

	expect(inserted).toEqual([{ id: 'one', value: 'new' }]);
	expect(
		applyDatabaseChange(inserted, { eventType: 'DELETE', new: {}, old: { id: 'one' } }, keyOf)
	).toEqual([]);
});

test('events received during a fetch are replayed over its snapshot', () => {
	const staleSnapshot = [
		{ id: 'updated', value: 'old' },
		{ id: 'deleted', value: 'remove me' }
	];
	const events = [
		{
			eventType: 'INSERT' as const,
			new: { id: 'inserted', value: 'present' },
			old: {}
		},
		{
			eventType: 'UPDATE' as const,
			new: { id: 'updated', value: 'current' },
			old: { id: 'updated' }
		},
		{
			eventType: 'DELETE' as const,
			new: {},
			old: { id: 'deleted' }
		}
	];

	expect(replayDatabaseChanges(staleSnapshot, events, keyOf)).toEqual([
		{ id: 'updated', value: 'current' },
		{ id: 'inserted', value: 'present' }
	]);
});

test('an update can change a row key without leaving the old row behind', () => {
	expect(
		applyDatabaseChange(
			[{ id: 'old-key', value: 'value' }],
			{
				eventType: 'UPDATE',
				new: { id: 'new-key', value: 'value' },
				old: { id: 'old-key' }
			},
			keyOf
		)
	).toEqual([{ id: 'new-key', value: 'value' }]);
});
