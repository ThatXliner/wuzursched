<script lang="ts">
	import ViewSchedule from './ViewSchedule.svelte';

	import type { Schedule, VirtualSchedule } from '$lib/schedule';
	import type { Class } from './types';
	import { copyToClipboard } from '$lib/actions';
	import type { You } from './ViewSchedules';
	import Fuse from 'fuse.js';

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
	const PERIODS: (keyof VirtualSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
	function matches(a: VirtualSchedule, b: VirtualSchedule) {
		return PERIODS.some((x) => a[x] === b[x]);
	}
	let searchQuery = $state('');
	let fuse = $derived(new Fuse(schedules, { keys: ['student'] }));
	let filtered = $derived(searchQuery ? fuse.search(searchQuery).map((x) => x.item) : schedules);
</script>

<label class="input input-bordered flex items-center gap-2 w-96 mx-auto my-5">
	<input type="text" class="grow" placeholder="Search for a student" bind:value={searchQuery} />
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 16 16"
		fill="currentColor"
		class="h-4 w-4 opacity-70"
	>
		<path
			fill-rule="evenodd"
			d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
			clip-rule="evenodd"
		/>
	</svg>
</label>
<div class="flex flex-wrap justify-evenly">
	{#each filtered as schedule (schedule.student)}
		<!-- You is guaranteed to !== null -->
		<!-- I'm not sure how to express TypeScript -->
		<!-- Within Svelte code -->
		{#if you === 'tentative'}
			<button
				class="btn my-3 h-fit w-fit border border-base-300 bg-base-100 shadow-xl rounded-box p-4 text-xl font-medium"
				onclick={() => {
					you = { name: schedule.student, schedule };
					window.localStorage.setItem(room, JSON.stringify(you));
				}}
			>
				{schedule.student}
			</button>
		{:else if you == null}
			<p>Please input who you are first</p>
		{:else if (onlyMatching && matches(you.schedule, schedule)) || !onlyMatching}
			<ViewSchedule {schedule} {you} {getClass} />
		{/if}
	{:else}
		<div class="alert alert-warning shadow-lg mx-auto w-fit">
			<div>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="stroke-current flex-shrink-0 h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					><path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/></svg
				>
				<span
					>No schedules found. <button
						class="link link-primary"
						use:copyToClipboard={{
							message: 'Room URL copied to clipboard',
							value: window.location.href
						}}>Invite people!</button
					></span
				>
			</div>
		</div>
	{/each}
</div>
