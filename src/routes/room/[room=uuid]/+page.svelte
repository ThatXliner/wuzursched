<script lang="ts">
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import InfoInput from '$lib/InfoInput.svelte';

	import { page } from '$app/stores';
	import { supabase } from '$lib/db';
	import { sqlEscape, normalize } from '$lib/utils';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	import type { VirtualSchedule, Classes, Class } from '$lib/InfoInput.d';
	import type { Writable } from 'svelte/store';

	type Schedule = VirtualSchedule & {
		room: string;
		student: string;
	};
	/** @type {import('./$types').PageData */
	export let data;
	let schedules: Writable<Schedule[]> = writable(data.data);
	async function getClass(id: string) {
		let { data, error } = await supabase.from('classes').select('*').eq('id', id);
		if (error !== null) {
			throw error;
		}
		return data![0];
	}
	async function getClasses(room: string) {
		return await supabase.from('classes').select('*').eq('room', room);
	}
	let you: null | {
		name: string;
		schedule: Schedule;
	} = null;
	let classes: Writable<Classes> = writable([]);
	let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = 'CLOSED';
	onMount(async () => {
		{
			const { data, error } = await getClasses($page.params['room']);
			if (error !== null) {
				throw error;
			}
			$classes = data;
		}
		// Load it from localStorage
		you = JSON.parse(window.localStorage.getItem($page.params['room']) ?? 'null');
		if (
			you !== null &&
			// the database remembers your name
			(
				await supabase
					.from('schedules')
					.select('*')
					.eq('room', $page.params['room'])
					.eq('student', you['name'])
			).data?.length == 0
		) {
			// let toInsert: Schedule = you.schedule
			let toInsert: Schedule = {
				...you['schedule'],
				room: $page.params['room'],
				student: you.name
			};

			await supabase.from('schedules').insert([toInsert]);
		}
		supabase
			.channel('schema-db-changes')
			.on<Schedule>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'schedules',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because $page.params
					// is being validated)
					filter: `room=eq.${sqlEscape($page.params['room'])}`
				},
				(payload) => {
					if (payload.eventType === 'INSERT') {
						schedules.update(($schedules) => [...$schedules, payload.new]);
					}
					console.log('1', payload);
				}
			)
			.on<Class>(
				'postgres_changes',
				{
					// The only valid event (when I'm not clearing the db/devving)
					event: 'INSERT',
					schema: 'public',
					table: 'classes',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because $page.params
					// is being validated)
					filter: `room=eq.${sqlEscape($page.params['room'])}`
				},
				async (payload) => {
					$classes = [...$classes, payload.new];
				}
			)
			.subscribe((status) => {
				realtimeStatus = status;
			});
	});
	function onInfoSubmitted(event: { detail: { name: string; schedule: VirtualSchedule } }) {
		const got = event.detail;
		let toInsert = { ...got.schedule, room: $page.params['room'], student: got.name };
		supabase
			.from('schedules')
			.insert([toInsert])
			.then(() => {
				you = { name: event.detail.name, schedule: toInsert };
				// no need to update the local db variable
				// since that will be updated via the realtime subscription
				window.localStorage.setItem($page.params['room'], JSON.stringify(you));
			});
	}
	async function addClass({
		className,
		firstName,
		lastName
	}: {
		className: string;
		firstName: string;
		lastName: string;
	}) {
		const payload = {
			name: normalize(className),
			teacher_first: firstName.trim().toLowerCase(),
			teacher_last: lastName.trim().toLowerCase(),
			room: $page.params['room']
		};
		// XXX: Uh am I actually able to read this
		const { data, error } = await supabase.from('classes').insert([payload]).select();
		if (error !== null) {
			throw error;
		}
		return data![0].id;
	}
</script>

{#if you === null}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<div class="modal-box max-h-screen h-3/4 max-w-screen overflow-visible">
			<h3 class="font-bold text-lg">But first...</h3>
			<p class="py-4">Please enter your information</p>
			<InfoInput on:submit={onInfoSubmitted} classes={$classes} {addClass} />
		</div>
	</dialog>
{/if}
<main class="hero min-h-[30vh]">
	<div class="hero-content flex-col">
		<h1 class="text-5xl text-center font-bold">
			Schedules for room <code>{$page.params['room'].slice(0, 8)}</code>
		</h1>
		<div class="flex justify-evenly flex-row space-x-4">
			<button
				class="btn btn-accent"
				on:click={() => {
					navigator.clipboard.writeText(window.location.href);
				}}
				><svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="w-6 h-6"
				>
					<path
						fill-rule="evenodd"
						d="M10.5 3A1.501 1.501 0 009 4.5h6A1.5 1.5 0 0013.5 3h-3zm-2.693.178A3 3 0 0110.5 1.5h3a3 3 0 012.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 01-3 3H6.75a3 3 0 01-3-3V6.257c0-1.47 1.073-2.756 2.57-2.93.493-.057.989-.107 1.487-.15z"
						clip-rule="evenodd"
					/>
				</svg>
				Share Room Link
			</button>
			<a href="/" class="btn"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					/>
				</svg></a
			>
			<button class="btn btn-primary mx-auto" disabled>Find common classes</button>
		</div>
	</div>
</main>

<div class="flex flex-wrap space-x-4 justify-evenly">
	{#each $schedules as schedule}
		<div
			class="my-3 collapse h-fit w-fit collapse-plus border border-base-300 bg-base-100 shadow-xl rounded-box"
		>
			<input type="checkbox" />
			<div class="collapse-title text-xl font-medium">
				{schedule.student}'s schedule
				<!-- TODO: Show if in common -->
			</div>
			<div class="collapse-content hidden">
				<div class="overflow-x-auto">
					<!-- If statement to appease type checker -->
					{#if you !== null}
						<ScheduleDisplay them={schedule} you={you.schedule} {getClass} />
					{/if}
				</div>
			</div>
		</div>
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
				<span>No schedules found. Invite people!</span>
			</div>
		</div>
	{/each}
</div>
<!-- It doesn't seem to be centered
when left is set to 50% -->
<span class="fixed left-[43%] bottom-10 pointer-events-none btn btn-outline rounded-box">
	Realtime: {#if realtimeStatus === 'SUBSCRIBED'}<span class="badge badge-success">connected</span
		>{:else}<span class="badge badge-error">disconnected</span>{/if}
</span>

<style>
	input[type='checkbox']:checked ~ .collapse-content {
		display: block;
	}
</style>
