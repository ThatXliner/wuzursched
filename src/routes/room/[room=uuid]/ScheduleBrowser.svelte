<script lang="ts">
	import type { Class, Schedule } from '$lib/InfoInput';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import { scheduleKey, sharedPeriods } from './scheduleComparison';
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
	$effect(() => {
		const selectedKey = selected ? scheduleKey(selected) : null;
		if (selectedKey && !schedules.some((schedule) => scheduleKey(schedule) === selectedKey)) {
			selected = null;
		}
	});
</script>

<section class="mx-auto w-full max-w-6xl px-3 py-5" aria-label="Schedule comparison">
	<div class="mb-4 flex flex-wrap items-end justify-between gap-2">
		<div>
			<h2 class="text-3xl font-bold">People & matches</h2>
			<p class="text-sm opacity-70">
				{schedules.length}
				{schedules.length === 1 ? 'person' : 'people'} shown. Choose a person to load their full schedule.
			</p>
		</div>
		<p class="text-sm opacity-70" aria-label="Shared class legend">
			<span class="badge badge-success mr-1" aria-hidden="true">2 shared</span> classes in common
		</p>
	</div>

	{#if schedules.length === 0}
		<div role="status" class="alert alert-warning">
			<span>{emptyMessage}</span>
		</div>
	{:else}
		<div class="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(20rem,3fr)]">
			<div class="overflow-hidden rounded-box border border-base-300 bg-base-100">
				<div class="max-h-[32rem] overflow-y-auto overscroll-contain" aria-label="People">
					{#each schedules as schedule (scheduleKey(schedule))}
						{@const key = scheduleKey(schedule)}
						{@const matches = sharedPeriods(you.schedule, schedule).length}
						{@const isYou = key === scheduleKey(you.schedule)}
						<button
							type="button"
							class="flex min-h-16 w-full items-center gap-3 border-b border-base-300 px-4 py-3 text-left last:border-b-0 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
							class:bg-base-200={selected && scheduleKey(selected) === key}
							aria-pressed={selected ? scheduleKey(selected) === key : false}
							aria-current={isYou ? 'true' : undefined}
							onclick={() => (selected = schedule)}
						>
							<span class="min-w-0 flex-1">
								<span class="block truncate text-lg font-medium" title={schedule.student}
									>{schedule.student}</span
								>
								{#if isYou}<span class="text-xs font-bold text-primary">You</span>{/if}
							</span>
							<span
								class="badge shrink-0"
								class:badge-success={matches > 0}
								class:badge-ghost={matches === 0}
							>
								{matches} shared
							</span>
							<svg
								viewBox="0 0 20 20"
								fill="currentColor"
								class="size-5 shrink-0"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 1 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
									clip-rule="evenodd"
								/>
							</svg>
						</button>
					{/each}
				</div>
			</div>

			<div class="min-w-0 rounded-box border border-base-300 bg-base-100 p-4 lg:sticky lg:top-4">
				{#if selected}
					<div class="mb-2 flex items-start justify-between gap-3">
						<h3 class="min-w-0 break-words text-2xl font-bold">{selected.student}'s schedule</h3>
						{#if scheduleKey(selected) === scheduleKey(you.schedule)}
							<span class="badge badge-primary shrink-0">You</span>
						{/if}
					</div>
					<ScheduleDisplay them={selected} you={you.schedule} {getClass} />
				{:else}
					<div class="flex min-h-48 items-center justify-center p-6 text-center" role="status">
						<div>
							<h3 class="text-2xl font-bold">Select a person</h3>
							<p class="mt-1 max-w-sm opacity-70">
								Schedule details stay unloaded until you choose someone, keeping large rooms quick
								to scan.
							</p>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>
