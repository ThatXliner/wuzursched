<script lang="ts">
	import { isEqual } from 'lodash-es';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import type { Schedule, Class } from '$lib/InfoInput';
	import type { ResolvedYou } from './ViewSchedules';
	export let schedule: Schedule;
	export let you: ResolvedYou;
	export let getClass: (id: string) => Promise<Class>;
</script>

<div
	class="my-3 collapse h-fit w-fit collapse-plus border border-base-300 bg-base-100 shadow-xl rounded-box"
>
	<input type="checkbox" />
	<div class="collapse-title text-xl font-medium">
		{schedule.student}'s schedule {isEqual({ name: schedule.student, schedule }, you)
			? '(you)'
			: ''}
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
