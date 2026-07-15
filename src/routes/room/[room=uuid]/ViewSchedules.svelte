<script lang="ts">
	import { copyToClipboard } from '$lib/actions';
	import type { Schedule } from '$lib/schedule';
	import Fuse from 'fuse.js';
	import ScheduleBrowser from './ScheduleBrowser.svelte';
	import { prioritizeCurrentSchedule } from './schedule-order';
	import { hasSharedClass } from './scheduleComparison';
	import type { Class } from './types';
	import type { You } from './ViewSchedules';

	let {
		schedules,
		you = $bindable(),
		room,
		onlyMatching,
		getClass
	}: {
		schedules: Schedule[];
		you: You;
		room: string;
		onlyMatching: boolean;
		getClass: (id: string) => Promise<Class>;
	} = $props();

	let searchQuery = $state('');
	let fuse = $derived(new Fuse(schedules, { keys: ['student'] }));
	let filtered = $derived(
		prioritizeCurrentSchedule(
			searchQuery ? fuse.search(searchQuery).map((result) => result.item) : schedules,
			you
		)
	);
	let visible = $derived.by(() => {
		if (you === null || you === 'tentative' || !onlyMatching) return filtered;
		const yourSchedule = you.schedule;
		return filtered.filter((schedule) => hasSharedClass(yourSchedule, schedule));
	});
</script>

<label
	class="input input-bordered mx-auto my-5 flex w-[min(24rem,calc(100%-1.5rem))] items-center gap-2"
>
	<span class="sr-only">Search students</span>
	<input type="text" class="grow" placeholder="Search for a student" bind:value={searchQuery} />
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
		fill="currentColor"
		class="h-4 w-4 opacity-70"
		aria-hidden="true"
	>
		<path
			fill-rule="evenodd"
			d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
			clip-rule="evenodd"
		/>
	</svg>
</label>

{#if you === 'tentative'}
	<section class="mx-auto w-full max-w-3xl px-3 pb-6" aria-labelledby="identity-heading">
		<h2 id="identity-heading" class="mb-3 text-3xl font-bold">Who are you?</h2>
		{#if filtered.length > 0}
			<div class="max-h-[32rem] overflow-y-auto rounded-box border border-base-300 bg-base-100">
				{#each filtered as schedule (schedule.student)}
					<button
						type="button"
						class="block min-h-14 w-full truncate border-b border-base-300 px-4 py-3 text-left text-lg font-medium last:border-b-0 hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
						title={schedule.student}
						onclick={() => {
							you = { name: schedule.student, schedule };
							window.localStorage.setItem(room, JSON.stringify(you));
						}}
					>
						{schedule.student}
					</button>
				{/each}
			</div>
		{:else}
			<div role="status" class="alert alert-warning">
				<span>No people found for “{searchQuery}”.</span>
			</div>
		{/if}
	</section>
{:else if you == null}
	<p class="p-6 text-center" role="status">Enter your information to compare schedules.</p>
{:else}
	<ScheduleBrowser
		schedules={visible}
		{you}
		{getClass}
		emptyMessage={schedules.length === 0
			? 'No schedules have been added yet. Invite people to this room to get started.'
			: 'No schedules match your current search and filters.'}
	/>
	{#if schedules.length === 0}
		<div class="pb-6 text-center">
			<button
				class="link link-primary"
				use:copyToClipboard={{
					message: 'Room URL copied to clipboard',
					value: window.location.href
				}}>Copy the room link</button
			>
		</div>
	{/if}
{/if}
