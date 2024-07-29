<script lang="ts">
	import { isEqual } from 'lodash-es';
	import type { Writable } from 'svelte/store';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import type { Schedule, VirtualSchedule, Class } from '$lib/InfoInput';
	import { copyToClipboard } from '$lib/actions';
	import type { You } from './ViewSchedules';

	export let schedules: Writable<Schedule[]>;
	export let you: You;
	export let room: string;
	export let onlyMatching: boolean;
	export let getClass: (id: string) => Promise<Class>;
	const PERIODS: (keyof VirtualSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
	function matches(a: VirtualSchedule, b: VirtualSchedule) {
		return PERIODS.some((x) => a[x] === b[x]);
	}
</script>

<div class="flex flex-wrap justify-evenly">
	{#each $schedules as schedule}
		<!-- You is guaranteed to !== null -->
		<!-- I'm not sure how to express TypeScript -->
		<!-- Within Svelte code -->
		{#if you === 'tentative'}
			<button
				class="btn my-3 h-fit w-fit border border-base-300 bg-base-100 shadow-xl rounded-box p-4 text-xl font-medium"
				on:click={() => {
					you = { name: schedule.student, schedule };
					window.localStorage.setItem(room, JSON.stringify(you));
				}}
			>
				{schedule.student}
			</button>
		{:else if you === null}
			<p>Please input who you are first</p>
		{:else if (onlyMatching && matches(you.schedule, schedule)) || !onlyMatching}
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
						{#if you != null}
							<ScheduleDisplay them={schedule} you={you.schedule} {getClass} />
						{/if}
					</div>
				</div>
			</div>
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

<style>
	input[type='checkbox']:checked ~ .collapse-content {
		display: block;
	}
</style>
