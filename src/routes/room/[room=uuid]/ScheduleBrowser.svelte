<script lang="ts">
	import type { Schedule } from '$lib/schedule';
	import { onMount } from 'svelte';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import { scheduleKey, sharedPeriods } from './scheduleComparison';
	import type { Class } from './types';
	import type { ResolvedYou } from './ViewSchedules';

	let {
		schedules,
		you,
		getClass,
		emptyMessage = 'No schedules match these filters.'
	}: {
		schedules: Schedule[];
		you: ResolvedYou;
		getClass: (id: string) => Promise<Class>;
		emptyMessage?: string;
	} = $props();

	let selected: Schedule | null = $state(null);
	let hydrated = $state(false);
	onMount(() => (hydrated = true));

	$effect(() => {
		const selectedKey = selected ? scheduleKey(selected) : null;
		if (selectedKey && !schedules.some((schedule) => scheduleKey(schedule) === selectedKey)) {
			selected = null;
		}
	});

	function toggle(schedule: Schedule) {
		selected = selected && scheduleKey(selected) === scheduleKey(schedule) ? null : schedule;
	}
</script>

<section class="mx-auto w-full max-w-6xl px-3 py-5" aria-label="Schedule comparison">
	<div class="mb-4">
		<h2 class="text-3xl font-bold">Schedules</h2>
		<p class="text-sm opacity-70">
			{schedules.length}
			{schedules.length === 1 ? 'schedule' : 'schedules'} shown. Open a card to see the full schedule.
		</p>
	</div>

	{#if schedules.length === 0}
		<div role="status" class="alert alert-warning">
			<span>{emptyMessage}</span>
		</div>
	{:else}
		<div class="grid items-start gap-4 md:grid-cols-2" aria-label="Schedule cards">
			{#each schedules as schedule (scheduleKey(schedule))}
				{@const key = scheduleKey(schedule)}
				{@const matches = sharedPeriods(you.schedule, schedule).length}
				{@const isYou = key === scheduleKey(you.schedule)}
				{@const expanded = selected ? scheduleKey(selected) === key : false}
				<article
					class="min-w-0 overflow-hidden rounded-box border bg-base-100 shadow-sm transition-shadow {expanded
						? 'border-primary shadow-md md:col-span-2'
						: 'border-base-300'} {isYou ? 'ring-2 ring-primary/30' : ''}"
					data-current-user={isYou || undefined}
				>
					<button
						type="button"
						disabled={!hydrated}
						class="flex min-h-20 w-full items-center gap-3 px-5 py-4 text-left hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
						aria-expanded={expanded}
						onclick={() => toggle(schedule)}
					>
						<span class="min-w-0 flex-1">
							<span class="block break-words text-xl font-bold">{schedule.student}</span>
							<span class="mt-1 flex flex-wrap gap-2">
								{#if isYou}<span class="badge badge-primary badge-sm">You</span>{/if}
								<span
									class="badge badge-sm"
									class:badge-success={matches > 0}
									class:badge-ghost={matches === 0}>{matches} shared</span
								>
							</span>
						</span>
						<span class="hidden text-sm font-medium opacity-70 sm:inline">
							{expanded ? 'Hide schedule' : 'View schedule'}
						</span>
						<span aria-hidden="true" class="btn btn-circle btn-ghost btn-sm pointer-events-none">
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 transition-transform"
								class:rotate-90={expanded}
							>
								<path
									fill-rule="evenodd"
									d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
									clip-rule="evenodd"
								/>
							</svg>
						</span>
					</button>
					{#if expanded}
						<div class="border-t border-base-300 p-4 sm:p-5">
							<div class="mb-3 flex items-start justify-between gap-3">
								<h3 class="min-w-0 break-words text-2xl font-bold">
									{schedule.student}'s schedule
								</h3>
								{#if isYou}<span class="badge badge-primary shrink-0">You</span>{/if}
							</div>
							<ScheduleDisplay them={schedule} you={you.schedule} {getClass} />
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>
