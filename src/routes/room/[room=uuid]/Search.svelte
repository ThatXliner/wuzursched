<script lang="ts">
	import type { Schedule, UnfinishedSchedule } from '$lib/schedule';
	import { formatClassName, formatTeacherName } from '$lib/utils';
	import ScheduleBrowser from './ScheduleBrowser.svelte';
	import type { ResolvedYou } from './ViewSchedules';
	import { matchesSelectedClasses, scheduleKey } from './scheduleComparison';
	import type { Class } from './types';
	const periods = [0, 1, 2, 3] as const;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	const allPeriods = [...aDay, ...bDay] as const;
	let {
		schedules = [],
		you,
		getClass
	}: {
		schedules?: Schedule[];
		you: ResolvedYou;
		getClass: (id: string) => Promise<Class>;
	} = $props();
	let sharedClass: UnfinishedSchedule = $state({});
	let filtered = $derived(
		schedules
			.filter((schedule) => scheduleKey(schedule) !== scheduleKey(you.schedule))
			.filter((schedule) => matchesSelectedClasses(schedule, sharedClass))
	);
	let filterClasses = $derived(
		Promise.all(allPeriods.map((period) => getClass(you.schedule[period])))
	);
</script>

<div
	class="mx-auto my-5 h-fit w-[min(64rem,calc(100%-1.5rem))] rounded-box border border-base-300 bg-base-100 p-4"
>
	<h2 class="text-3xl font-bold">Filter by your classes</h2>
	<p class="mb-3 text-sm opacity-70">
		Select one or more periods. Results must share every selection.
	</p>
	{#await filterClasses}
		<div class="flex min-h-32 items-center justify-center" role="status">
			<span class="loading loading-spinner loading-md" aria-hidden="true"></span>
			<span class="ml-3">Loading class filters…</span>
		</div>
	{:then resolvedClasses}
		<div class="overflow-x-auto" role="region" aria-label="Class filters">
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
						{@const scheduleA = you.schedule[aDay[period]]}
						{@const scheduleB = you.schedule[bDay[period]]}
						{@const classA = resolvedClasses[period]}
						{@const classB = resolvedClasses[period + 4]}
						<tr>
							<th>Period {period + 1}</th>
							<td
								><button
									class="btn btn-outline btn-accent"
									class:btn-active={sharedClass[aDay[period]] == scheduleA}
									aria-pressed={sharedClass[aDay[period]] == scheduleA}
									onclick={() => {
										if (sharedClass[aDay[period]] == scheduleA) {
											sharedClass[aDay[period]] = undefined;
										} else {
											sharedClass[aDay[period]] = scheduleA;
										}
									}}
								>
									<span
										>{formatClassName(classA['name'])}
										<span class="text-xs text-gray-500"
											>{formatTeacherName(
												`${classA['teacher_first']} ${classA['teacher_last']}`
											)}</span
										></span
									>
								</button></td
							>
							<td
								><button
									class="btn btn-outline btn-accent"
									class:btn-active={sharedClass[bDay[period]] == scheduleB}
									aria-pressed={sharedClass[bDay[period]] == scheduleB}
									onclick={() => {
										if (sharedClass[bDay[period]] == scheduleB) {
											sharedClass[bDay[period]] = undefined;
										} else {
											sharedClass[bDay[period]] = scheduleB;
										}
									}}
								>
									<span
										>{formatClassName(classB['name'])}
										<span class="text-xs text-gray-500"
											>{formatTeacherName(
												`${classB['teacher_first']} ${classB['teacher_last']}`
											)}</span
										></span
									>
								</button></td
							>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:catch}
		<div role="alert" class="alert alert-error">
			<span>We couldn't load your class filters. Please try again.</span>
		</div>
	{/await}
</div>
<ScheduleBrowser
	schedules={filtered}
	{you}
	{getClass}
	emptyMessage="No other schedules share every selected class."
/>
