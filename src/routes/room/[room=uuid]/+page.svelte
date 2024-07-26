<script lang="ts">
	import * as Tabs from '$lib/components/ui/tabs';
	import ScheduleDisplay from './ScheduleDisplay.svelte';
	import InfoInput from '$lib/InfoInput.svelte';

	import { page } from '$app/stores';
	import { sqlEscape, normalize } from '$lib/utils';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';

	import type { VirtualSchedule, Classes, Class } from '$lib/InfoInput.d';
	import type { Writable } from 'svelte/store';
	import memoize from 'lodash-es/memoize';
	import isEqual from 'lodash-es/isEqual';
	import Toasts from '$lib/Toasts.svelte';
	import { addToast } from '$lib/toasts';
	// import type { PageServerData } from './$types';

	let onlyMatching: boolean;
	const PERIODS: (keyof VirtualSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
	function matches(a: VirtualSchedule, b: VirtualSchedule) {
		return PERIODS.some((x) => a[x] === b[x]);
	}
	type Schedule = VirtualSchedule & {
		room: string;
		student: string;
	};
	export let data;
	const { supabase } = data;
	const schedules: Writable<Schedule[]> = writable(data.data);
	async function _getClass(id: string) {
		const { data, error } = await supabase.from('classes').select('*').eq('id', id);
		if (error !== null) {
			throw error;
		}
		console.assert(data !== null);
		return data![0];
	}
	const getClass = memoize(_getClass);
	async function getClasses(room: string) {
		return await supabase.from('classes').select('*').eq('room', room);
	}
	let you:
		| {
				name: string;
				schedule: Schedule;
		  }
		| null
		| 'tentative';
	let classes: Writable<Classes> = writable([]);
	let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = 'CLOSED';
	onMount(async () => {
		{
			const { data, error } = await getClasses($page.params.room);
			// did not convert to console.assert
			// to appease TypeScript
			if (error !== null) {
				throw error;
			}
			$classes = data;
		}
		// Load it from localStorage
		you = JSON.parse(window.localStorage.getItem($page.params.room) ?? 'null');
		if (
			// If your log-in exists
			// But the database forgot about you
			you !== null &&
			(
				await supabase
					.from('schedules')
					.select('*')
					.eq('room', $page.params.room)
					.eq('student', you.name)
			).data?.length === 0
		) {
			// you'll have to do the whole process again
			you = null;
			window.localStorage.removeItem($page.params['room']);
			// old code:
			// let toInsert: Schedule = {
			// 	...you['schedule'],
			// 	room: $page.params['room'],
			// 	student: you.name
			// };
			// // they should be equivalent
			// console.assert(isEqual(toInsert, you.schedule));
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
					filter: `room=eq.${sqlEscape($page.params.room)}`
				},
				(payload) => {
					if (payload.eventType === 'INSERT') {
						schedules.update(($schedules) => [...$schedules, payload.new]);
						addToast(`${payload.new.student} just added their schedule to this room`);
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
					filter: `room=eq.${sqlEscape($page.params.room)}`
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
		const toInsert = { ...got.schedule, room: $page.params.room, student: got.name };
		supabase
			.from('schedules')
			.insert([toInsert])
			.then(() => {
				you = { name: event.detail.name, schedule: toInsert };
				// no need to update the local db variable
				// since that will be updated via the realtime subscription
				window.localStorage.setItem($page.params.room, JSON.stringify(you));
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
			room: $page.params.room
		};
		const { data, error } = await supabase.from('classes').insert([payload]).select();
		if (error !== null) {
			// error.code == 23505 is duplicate entry
			if (error.code == '23505') {
				addToast('Attempted to add duplicate class', 'error');
			}
			throw error;
		}
		return data![0].id;
	}
</script>

<Toasts />
{#if you === null}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<Toasts />
		<div class="modal-box max-h-screen h-fit max-w-screen overflow-visible">
			<h3 class="font-bold text-lg">But first...</h3>
			<p class="py-4">Please enter your information</p>
			<InfoInput on:submit={onInfoSubmitted} classes={$classes} {addClass} />
			<button
				class="btn btn-accent w-full my-4"
				on:click={() => {
					you = 'tentative';
				}}>"But I already have a schedule in here!"</button
			>
		</div>
	</dialog>
{/if}

<div class="hero min-h-[30vh]">
	<div class="hero-content flex-col">
		<h1 class="text-5xl text-center font-bold">
			Schedules for room <code class="bg-base-200 p-1 rounded-lg"
				>{$page.params.room.slice(0, 8)}</code
			>
		</h1>
		<div class="flex justify-evenly flex-row space-x-4 mt-3">
			<!-- <div class="flex justify-evenly flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0"> -->
			<div class="tooltip tooltip-right md:tooltip-top" data-tip="Copy room link to clipboard">
				<button
					class="btn btn-accent"
					on:click={() => {
						if (window.location.href.includes('devMode')) {
							let value = window.localStorage.getItem($page.params.room);
							if (value !== null) {
								navigator.clipboard.writeText(value).then(() => {
									addToast('Room session value copied to clipboard', 'success');
								});
							} else {
								addToast('Room session value not found', 'error');
							}
						} else {
							navigator.clipboard.writeText(window.location.href).then(() => {
								addToast('Room URL copied to clipboard', 'success');
							});
						}
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
				</button>
			</div>
			<a href="/" class="btn" title="Go home"
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
			<div class="tooltip" data-tip="Only show schedules with matching classes">
				<div class="form-control bg-base-200 rounded-box p-1">
					<label class="label cursor-pointer space-x-3">
						<span class="label-text">Only show matching</span>
						<input type="checkbox" class="toggle toggle-primary" bind:checked={onlyMatching} />
					</label>
				</div>
			</div>
		</div>
	</div>
</div>
<Tabs.Root value="schedules">
	<!-- <Tabs.List> -->
	{#if you === 'tentative'}
		<div class="flex w-full justify-center space-x-4">
			<h3 class="text-3xl font-bold">Select who you are</h3>
			<button
				class="btn btn-error"
				on:click={() => {
					you = null;
				}}>Cancel</button
			>
		</div>
	{:else}
		<Tabs.List class="grid w-3/4 mx-auto grid-cols-3">
			<Tabs.Trigger value="schedules">All Schedules</Tabs.Trigger>
			<Tabs.Trigger value="search">Search</Tabs.Trigger>
			<Tabs.Trigger value="engineer">Schedule Engineer</Tabs.Trigger>
		</Tabs.List>
	{/if}
	<Tabs.Content value="schedules">
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
							window.localStorage.setItem($page.params.room, JSON.stringify(you));
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
						<span>No schedules found. Invite people!</span>
					</div>
				</div>
			{/each}
		</div>
	</Tabs.Content>
	<Tabs.Content value="password">Change your password here.</Tabs.Content>
</Tabs.Root>

<span
	class="sticky center-horizontal bottom-5 drop-shadow-lg tooltip"
	data-tip="You are {realtimeStatus === 'SUBSCRIBED'
		? 'connected'
		: 'disconnected'} to the realtime server"
>
	{#if realtimeStatus === 'SUBSCRIBED'}<span class="badge badge-success p-3">connected</span
		>{:else}<span class="badge badge-error p-3">disconnected</span>{/if}
</span>

<style>
	input[type='checkbox']:checked ~ .collapse-content {
		display: block;
	}
	.center-horizontal {
		/*shift 50% of the page*/
		left: 50%;
		/* Move 50% of itself backwards */
		transform: translate(-50%, 0);
	}
</style>
