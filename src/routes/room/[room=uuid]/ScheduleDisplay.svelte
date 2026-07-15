<script lang="ts">
	import { formatClassName, formatTeacherName } from '$lib/utils';
	import type { VirtualSchedule } from '$lib/schedule';
	import { getClassMatch, type ClassMatch } from '$lib/scheduleComparison';
	import type { Class } from './types';
	let {
		them,
		you,
		getClass
	}: { them: VirtualSchedule; you: VirtualSchedule; getClass: (id: string) => Promise<Class> } =
		$props();

	const periods = [0, 1, 2, 3] as const;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	const matchLabels: Record<ClassMatch, string> = {
		'same-period': 'Same class, same period',
		'different-period': 'Same class, different period',
		'not-shared': 'Class not shared'
	};
	let resolvedClasses = $derived(
		Promise.all([...aDay, ...bDay].map((period) => getClass(them[period])))
	);
</script>

{#await resolvedClasses}
	<div class="flex min-h-48 items-center justify-center" role="status">
		<span class="loading loading-spinner loading-md" aria-hidden="true"></span>
		<span class="ml-3">Loading schedule details…</span>
	</div>
{:then classes}
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

	<div class="overflow-x-auto" role="region" aria-label="Schedule details">
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
					{@const classA = classes[period]}
					{@const classB = classes[period + 4]}
					{@const aMatch = getClassMatch(them, you, aDay[period])}
					{@const bMatch = getClassMatch(them, you, bDay[period])}
					<tr>
						<th>Period {period + 1}</th>
						<td>
							<div
								class="rounded-box w-fit p-2 py-3"
								class:bg-success={aMatch === 'same-period'}
								class:text-success-content={aMatch === 'same-period'}
								class:bg-warning={aMatch === 'different-period'}
								class:text-warning-content={aMatch === 'different-period'}
								data-match={aMatch}
							>
								<span>
									{formatClassName(classA.name)}
									<span class="text-xs text-gray-500">
										{formatTeacherName(`${classA.teacher_first} ${classA.teacher_last}`)}
									</span>
									<span class="sr-only"> — {matchLabels[aMatch]}</span>
								</span>
							</div>
						</td>
						<td>
							<div
								class="rounded-box w-fit p-2 py-3"
								class:bg-success={bMatch === 'same-period'}
								class:text-success-content={bMatch === 'same-period'}
								class:bg-warning={bMatch === 'different-period'}
								class:text-warning-content={bMatch === 'different-period'}
								data-match={bMatch}
							>
								<span>
									{formatClassName(classB.name)}
									<span class="text-xs text-gray-500">
										{formatTeacherName(`${classB.teacher_first} ${classB.teacher_last}`)}
									</span>
									<span class="sr-only"> — {matchLabels[bMatch]}</span>
								</span>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{:catch}
	<div role="alert" class="alert alert-error">
		<span>We couldn't load this schedule. Please try selecting it again.</span>
	</div>
{/await}
