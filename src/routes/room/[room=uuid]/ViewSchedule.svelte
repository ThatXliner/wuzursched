<script lang="ts">
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import type { Schedule, Class } from '$lib/InfoInput';
	import type { ResolvedYou } from './ViewSchedules';
	import { isCurrentSchedule } from './schedule-order';
	let {
		schedule,
		you,
		getClass
	}: { schedule: Schedule; you: ResolvedYou; getClass: (id: string) => Promise<Class> } = $props();
	let isYou = $derived(isCurrentSchedule(schedule, you));
</script>

<div
	class="my-3 collapse h-fit w-fit collapse-plus border bg-base-100 shadow-xl rounded-box {isYou
		? 'border-primary bg-primary/10 ring-2 ring-primary/30'
		: 'border-base-300'}"
	data-current-user={isYou || undefined}
>
	<input type="checkbox" />
	<div class="collapse-title text-xl font-medium" class:text-primary={isYou}>
		{schedule.student}'s schedule {isYou ? '(you)' : ''}
		<!-- TODO: Show if in common -->
	</div>
	<div class="collapse-content hidden">
		<div class="overflow-x-auto">
			<!-- If statement to appease type checker -->
			<ScheduleDisplay them={schedule} you={you.schedule} {getClass} />
		</div>
	</div>
</div>

<style>
	input[type='checkbox']:checked ~ .collapse-content {
		display: block;
	}
</style>
