<script lang="ts">
	import { titlecase } from '$lib/utils';
	import type { VirtualSchedule, Class } from '$lib/InfoInput.d';
	export let them: VirtualSchedule, you: VirtualSchedule, getClass: (id: string) => Promise<Class>;
	const periods = [0, 1, 2, 3] as const;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
</script>

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
			{@const scheduleA = them[aDay[period]]}
			{@const scheduleB = them[bDay[period]]}
			{@const classA = getClass(scheduleA)}
			{@const classB = getClass(scheduleB)}
			{@const aInCommon = you && you[aDay[period]] == scheduleA}
			{@const bInCommon = you && you[bDay[period]] == scheduleB}
			{@const resolved = Promise.all([classA, classB])}
			{#await resolved then [classA, classB]}
				<!-- row 1 -->
				<tr>
					<th>Period {period + 1}</th>
					<td
						><div
							class="rounded-box p-2 py-3 w-fit"
							class:bg-success={aInCommon}
							class:text-success-content={aInCommon}
						>
							<span
								>{titlecase(classA['name'])}
								<span class="text-xs text-gray-500"
									>{titlecase(classA['teacher_first'])}
									{titlecase(classA['teacher_last'])}</span
								></span
							>
						</div></td
					>
					<td
						><div
							class="rounded-box p-2 py-3 w-fit"
							class:bg-success={bInCommon}
							class:text-success-content={bInCommon}
						>
							<span
								>{titlecase(classB['name'])}
								<span class="text-xs text-gray-500"
									>{titlecase(classB['teacher_first'])}
									{titlecase(classB['teacher_last'])}</span
								></span
							>
						</div></td
					>
				</tr>
			{/await}
		{/each}
	</tbody>
</table>
