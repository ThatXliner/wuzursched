<script lang="ts">
	import { formatClassName, formatTeacherName } from '$lib/utils';
	import type { VirtualSchedule, Class } from '$lib/InfoInput.d';
	import { getClassMatch, type ClassMatch } from '$lib/scheduleComparison';
	let {
		them,
		you,
		classes
	}: { them: VirtualSchedule; you: VirtualSchedule; classes: ReadonlyMap<string, Class> } =
		$props();
	const periods = [0, 1, 2, 3] as const;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	const matchLabels: Record<ClassMatch, string> = {
		'same-period': 'Same class, same period',
		'different-period': 'Same class, different period',
		'not-shared': 'Class not shared'
	};
</script>

<div class="mb-2 flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label="Schedule comparison legend">
	<span class="inline-flex items-center gap-2">
		<span class="size-4 rounded bg-success" aria-hidden="true"></span>
		{matchLabels['same-period']}
	</span>
	<span class="inline-flex items-center gap-2">
		<span class="size-4 rounded bg-warning" aria-hidden="true"></span>
		{matchLabels['different-period']}
	</span>
	<span class="inline-flex items-center gap-2">
		<span class="size-4 rounded border border-base-300 bg-base-100" aria-hidden="true"></span>
		{matchLabels['not-shared']}
	</span>
</div>

<table class="table w-full">
	<thead>
		<tr class="text-center">
			<th></th>
			<th>A day</th>
			<th>B day</th>
		</tr>
	</thead>
	<tbody>
		{#each periods as period (period)}
			{@const scheduleA = them[aDay[period]]}
			{@const scheduleB = them[bDay[period]]}
			{@const classA = classes.get(scheduleA)!}
			{@const classB = classes.get(scheduleB)!}
			{@const aMatch = getClassMatch(them, you, aDay[period])}
			{@const bMatch = getClassMatch(them, you, bDay[period])}
			<tr>
				<th>Period {period + 1}</th>
				<td
					><div
						class="rounded-box p-2 py-3 w-fit"
						class:bg-success={aMatch === 'same-period'}
						class:text-success-content={aMatch === 'same-period'}
						class:bg-warning={aMatch === 'different-period'}
						class:text-warning-content={aMatch === 'different-period'}
						data-match={aMatch}
					>
						<span
							>{formatClassName(classA['name'])}
							<span class="text-xs text-gray-500"
								>{formatTeacherName(`${classA['teacher_first']} ${classA['teacher_last']}`)}</span
							>
							<span class="sr-only"> — {matchLabels[aMatch]}</span></span
						>
					</div></td
				>
				<td
					><div
						class="rounded-box p-2 py-3 w-fit"
						class:bg-success={bMatch === 'same-period'}
						class:text-success-content={bMatch === 'same-period'}
						class:bg-warning={bMatch === 'different-period'}
						class:text-warning-content={bMatch === 'different-period'}
						data-match={bMatch}
					>
						<span
							>{formatClassName(classB['name'])}
							<span class="text-xs text-gray-500"
								>{formatTeacherName(`${classB['teacher_first']} ${classB['teacher_last']}`)}</span
							>
							<span class="sr-only"> — {matchLabels[bMatch]}</span></span
						>
					</div></td
				>
			</tr>
		{/each}
	</tbody>
</table>
