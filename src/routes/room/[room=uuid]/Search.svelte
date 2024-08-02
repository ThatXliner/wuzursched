<script lang="ts">
	import type { Class, Schedule, UnfinishedSchedule } from '$lib/InfoInput';
	import { titlecase } from '$lib/utils';
	import { isEqual } from 'lodash-es';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import ViewSchedule from './ViewSchedule.svelte';
	import type { ResolvedYou } from './ViewSchedules';
	const periods = [0, 1, 2, 3] as const;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	const allPeriods = [...aDay, ...bDay] as const;
	export let schedules: Schedule[] = [];
	export let you: ResolvedYou;
	export let getClass: (id: string) => Promise<Class>;
	let sharedClass: UnfinishedSchedule = {};
	$: filtered = schedules
		.filter((schedule) => !isEqual(schedule, you.schedule))
		.filter((schedule) =>
			allPeriods
				.map((period) => {
					return sharedClass[period] !== undefined ? schedule[period] == sharedClass[period] : true;
				})
				.every((x) => x)
		);
</script>

<div
	class="mx-auto my-3 p-3 h-fit w-fit collapse-plus border border-base-300 bg-base-100 shadow-xl rounded-box"
>
	<div class="text-xl font-medium">Filter by shared classes</div>
	<div class="overflow-x-auto">
		<!-- If statement to appease type checker -->
		{#if you != null && you !== 'tentative'}
			<table class="table w-full">
				<thead>
					<tr class="text-center">
						<th />
						<th>A day</th>
						<th>B day</th>
					</tr>
				</thead>
				<tbody>
					{#each periods as period}
						{@const scheduleA = you.schedule[aDay[period]]}
						{@const scheduleB = you.schedule[bDay[period]]}
						{@const classA = getClass(scheduleA)}
						{@const classB = getClass(scheduleB)}
						{@const resolved = Promise.all([classA, classB])}
						{#await resolved then [classA, classB]}
							<!-- row 1 -->
							<tr>
								<th>Period {period + 1}</th>
								<td
									><button
										class="btn btn-outline btn-accent"
										class:btn-active={sharedClass[aDay[period]] == scheduleA}
										on:click={() => {
											if (sharedClass[aDay[period]] == scheduleA) {
												sharedClass[aDay[period]] = undefined;
											} else {
												sharedClass[aDay[period]] = scheduleA;
											}
										}}
									>
										<span
											>{titlecase(classA['name'])}
											<span class="text-xs text-gray-500"
												>{titlecase(classA['teacher_first'])}
												{titlecase(classA['teacher_last'])}</span
											></span
										>
									</button></td
								>
								<td
									><button
										class="btn btn-outline btn-accent"
										class:btn-active={sharedClass[bDay[period]] == scheduleB}
										on:click={() => {
											if (sharedClass[bDay[period]] == scheduleB) {
												sharedClass[bDay[period]] = undefined;
											} else {
												sharedClass[bDay[period]] = scheduleB;
											}
										}}
									>
										<span
											>{titlecase(classB['name'])}
											<span class="text-xs text-gray-500"
												>{titlecase(classB['teacher_first'])}
												{titlecase(classB['teacher_last'])}</span
											></span
										>
									</button></td
								>
							</tr>
						{/await}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
<div class="flex w-full flex-col">
	<div class="divider">Results</div>
</div>
<div class="flex flex-wrap justify-evenly">
	{#each filtered as result}
		<ViewSchedule schedule={result} {you} {getClass} />
	{:else}
		<div role="alert" class="alert alert-warning w-fit">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 shrink-0 stroke-current"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
			<span>No results found</span>
		</div>
	{/each}
</div>
