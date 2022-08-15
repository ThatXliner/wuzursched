<!-- Don't use just yet -->
<script lang="ts">
	import type { definitions } from '$lib/db.d';
	import type { Schedule } from '$lib/InfoInput.d';
	export let you: {
		name: string;
		schedule: Schedule;
	};
	export let schedule: definitions['schedules'];
	export let getClass: (id: string) => definitions['classes'];
	let isCommon = false;
	function titlecase(x: string) {
		return x[0].toUpperCase() + x.slice(1);
	}
</script>

<div
	class="my-3 collapse w-fit collapse-plus border border-base-300 bg-base-100 shadow-xl rounded-box"
>
	<input type="checkbox" />
	<div class="collapse-title text-xl font-medium">
		{schedule.student}'s schedule
	</div>
	<div class="collapse-content">
		<div class="overflow-x-auto">
			<table class="table w-full">
				<thead>
					<tr class="text-center">
						<th />
						<th>A day</th>
						<th>B day</th>
					</tr>
				</thead>
				<tbody>
					{#each ['1', '2', '3', '4'] as period}
						{@const scheduleA = schedule[period + 'a']}
						{@const scheduleB = schedule[period + 'b']}
						{@const aInCommon = you && you['schedule'][period + 'a']?.id == scheduleA}
						{@const bInCommon = you && you['schedule'][period + 'b']?.id == scheduleB}
						{@const resolved = Promise.all([getClass(scheduleA), getClass(scheduleB)])}
						{#await resolved then [classA, classB]}
							<!-- row 1 -->
							<tr>
								<th>Period {period}</th>
								<td
									><div
										class="rounded-box p-2 w-fit"
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
										class="rounded-box p-2 w-fit"
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
		</div>
	</div>
</div>
