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
	const periods = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;
	let isYou = $derived(isCurrentSchedule(schedule, you));
	let expanded = $state(false);
	let details = $state<Promise<ReadonlyMap<string, Class>> | null>(null);

	async function loadDetails() {
		const ids = [...new Set(periods.map((period) => schedule[period]))];
		const classes = await Promise.all(ids.map((id) => getClass(id)));
		return new Map(ids.map((id, index) => [id, classes[index]]));
	}

	function toggle() {
		expanded = !expanded;
		if (expanded && details === null) {
			details = loadDetails();
		}
	}

	function retry() {
		details = loadDetails();
	}
</script>

<div
	class="my-3 collapse h-fit w-fit collapse-plus border bg-base-100 shadow-xl rounded-box {isYou
		? 'border-primary bg-primary/10 ring-2 ring-primary/30'
		: 'border-base-300'}"
	class:collapse-open={expanded}
	data-current-user={isYou || undefined}
>
	<button
		type="button"
		class="collapse-title text-left text-xl font-medium"
		class:text-primary={isYou}
		aria-expanded={expanded}
		onclick={toggle}
	>
		{schedule.student}'s schedule {isYou ? '(you)' : ''}
		<!-- TODO: Show if in common -->
	</button>
	{#if expanded}
		<div class="collapse-content">
			{#if details}
				{#await details}
					<div class="flex items-center gap-2 p-4" role="status">
						<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
						<span>Loading schedule…</span>
					</div>
				{:then classes}
					<div class="overflow-x-auto">
						<ScheduleDisplay them={schedule} you={you.schedule} {classes} />
					</div>
				{:catch}
					<div class="alert alert-error my-2" role="alert">
						<span>Unable to load this schedule.</span>
						<button type="button" class="btn btn-sm" onclick={retry}>Try again</button>
					</div>
				{/await}
			{/if}
		</div>
	{/if}
</div>
