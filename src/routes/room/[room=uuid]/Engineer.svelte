<script lang="ts">
	import type { Schedule } from '$lib/InfoInput';
	import Fuse from 'fuse.js';
	import type { Writable } from 'svelte/store';
	import ViewSchedule from './ViewSchedule.svelte';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import { findOptimumSchedules } from '$lib/engineer';

	export let schedules: Writable<Schedule[]>;
	export let getClass: (klass: string) => Promise<Class>;
	let searchQuery = '';
	let students: Schedule[] = [];
	$: fuse = new Fuse($schedules, { keys: ['student'] });
	$: filtered = searchQuery ? fuse.search(searchQuery).map((x) => x.item) : $schedules;
	$: found = filtered.length === 1;
	$: console.log(findOptimumSchedules(students));
</script>

<div class="flex justify-center">
	<div>
		<h2 class="text-5xl">Schedule Engineer: V1</h2>
		<p class="w-96 my-2">
			The schedule engineer allows you to figure out the steps required to have all of you and your
			friends to share as many classes as possible
		</p>
		<p class="w-96 mb-5">
			Future versions of Wuzursched Schedule Engineer will have pipeline-like features (via <a
				href="https://retejs.org/"
				class="link">Rete.js</a
			>)
		</p>
	</div>
</div>
<div class="w-3/4 mx-auto bg-base-200 rounded-box p-5 shadow-lg">
	<div class="dropdown">
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<div class="join" tabindex="0">
			<label class="input input-bordered flex items-center gap-2 join-item">
				<input type="text" class="grow" placeholder="Search" bind:value={searchQuery} />
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
			<button
				class="btn btn-primary join-item"
				disabled={!found}
				on:click={() => {
					students = [...students, filtered[0]];
					searchQuery = '';
				}}>Add Student</button
			>
		</div>
		<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
		<ul tabindex="0" class="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
			{#each filtered as schedule (schedule.student)}
				<li>
					<span
						on:click={() => {
							searchQuery = schedule.student;
						}}>{schedule.student}</span
					>
				</li>
			{:else}
				<p class="p-3">No results found</p>
			{/each}
		</ul>
	</div>
</div>
<div>
	<p>{JSON.stringify(students)}</p>
	<!-- <ViewSchedule {students} /> -->
</div>
