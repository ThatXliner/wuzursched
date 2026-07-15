<script lang="ts">
	import Search from './Search.svelte';

	import Realtime from '$lib/Realtime.svelte';

	import ViewSchedules from './ViewSchedules.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import InfoInput from '$lib/InfoInput.svelte';

	import { page } from '$app/state';
	import { sqlEscape, normalizeClassName, normalizeTeacherName } from '$lib/utils';
	import { onMount } from 'svelte';

	import type { VirtualSchedule, Classes, Class, Schedule } from '$lib/InfoInput.d';
	import type { PageData } from './$types';
	import memoize from 'lodash-es/memoize';
	import ToastList from '$lib/ToastList.svelte';
	import { addToast } from '$lib/toasts.svelte';
	import { copyToClipboard } from '$lib/actions';
	import type { You } from './ViewSchedules';
	import Engineer from './Engineer.svelte';
	import { applyDatabaseChange, replayDatabaseChanges, type DatabaseChange } from '$lib/realtime';
	import type { RealtimeChannel } from '@supabase/supabase-js';

	let { data }: { data: PageData } = $props();
	let supabase = $derived(data.supabase);
	// svelte-ignore state_referenced_locally -- realtime updates own this state after initial load
	let schedules: Schedule[] = $state(data.data);
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
	let you: You = $state()!;
	let classes: Classes = $state([]);
	let onlyMatching: boolean = $state(false);
	let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = $state('CLOSED');
	let room = $derived(page.params.room!);
	let refreshInFlight = false;
	let refreshAgain = false;
	let scheduleEventsDuringRefresh: DatabaseChange<Schedule>[] = [];
	let classEventsDuringRefresh: DatabaseChange<Class>[] = [];

	const scheduleKey = (schedule: Partial<Schedule>) =>
		schedule.room && schedule.student ? `${schedule.room}:${schedule.student}` : undefined;
	const classKey = (classRow: Partial<Class>) => classRow.id;

	function recoverMissingUser() {
		you = null;
		window.localStorage.removeItem(room);
	}

	function reconcileUser(nextSchedules: Schedule[]) {
		if (you === null || you === 'tentative') return;
		const currentUser = you;
		const currentSchedule = nextSchedules.find((schedule) => schedule.student === currentUser.name);
		if (currentSchedule === undefined) {
			recoverMissingUser();
			return;
		}
		you = { name: currentUser.name, schedule: currentSchedule };
		window.localStorage.setItem(room, JSON.stringify(you));
	}

	async function refreshRoom() {
		if (refreshInFlight) {
			refreshAgain = true;
			return;
		}

		refreshInFlight = true;
		scheduleEventsDuringRefresh = [];
		classEventsDuringRefresh = [];
		try {
			const [scheduleResult, classResult] = await Promise.all([
				supabase.from('schedules').select('*').eq('room', room),
				getClasses(room)
			]);
			if (scheduleResult.error !== null) throw scheduleResult.error;
			if (classResult.error !== null) throw classResult.error;

			const nextSchedules = replayDatabaseChanges(
				scheduleResult.data,
				scheduleEventsDuringRefresh,
				scheduleKey
			);
			schedules = nextSchedules;
			classes = replayDatabaseChanges(classResult.data, classEventsDuringRefresh, classKey);
			reconcileUser(nextSchedules);
		} catch (error) {
			console.error('Failed to refresh room after reconnecting', error);
			addToast('Could not refresh this room after reconnecting', 'error');
		} finally {
			refreshInFlight = false;
			if (refreshAgain) {
				refreshAgain = false;
				void refreshRoom();
			}
		}
	}

	function applyScheduleChange(change: DatabaseChange<Schedule>) {
		if (refreshInFlight) scheduleEventsDuringRefresh.push(change);
		schedules = applyDatabaseChange(schedules, change, scheduleKey);
		if (change.eventType === 'INSERT') {
			addToast(`${change.new.student} just added their schedule to this room`);
		}
		if (change.eventType !== 'INSERT') reconcileUser(schedules);
	}

	function applyClassChange(change: DatabaseChange<Class>) {
		if (refreshInFlight) classEventsDuringRefresh.push(change);
		classes = applyDatabaseChange(classes, change, classKey);
	}

	onMount(() => {
		you = JSON.parse(window.localStorage.getItem(room) ?? 'null');

		let previousStatus = realtimeStatus;
		let channel: RealtimeChannel;
		const handleOffline = () => {
			previousStatus = 'CLOSED';
		};
		const handleOnline = () => {
			if (realtimeStatus === 'SUBSCRIBED') void refreshRoom();
		};
		window.addEventListener('offline', handleOffline);
		window.addEventListener('online', handleOnline);

		channel = supabase
			.channel('schema-db-changes')
			.on<Schedule>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'schedules',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because page.params
					// is being validated)
					filter: `room=eq.${sqlEscape(room)}`
				},
				(payload) => applyScheduleChange(payload as DatabaseChange<Schedule>)
			)
			.on<Class>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'classes',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because page.params
					// is being validated)
					filter: `room=eq.${sqlEscape(room)}`
				},
				(payload) => applyClassChange(payload as DatabaseChange<Class>)
			)
			.subscribe((status) => {
				const reconnected = status === 'SUBSCRIBED' && previousStatus !== 'SUBSCRIBED';
				realtimeStatus = status;
				previousStatus = status;
				if (reconnected && navigator.onLine) void refreshRoom();
			});
		void refreshRoom();

		return () => {
			window.removeEventListener('offline', handleOffline);
			window.removeEventListener('online', handleOnline);
			void supabase.removeChannel(channel);
		};
	});
	async function onInfoSubmitted(detail: { name: string; schedule: VirtualSchedule }) {
		const toInsert = { ...detail.schedule, room, student: detail.name };
		const { error } = await supabase.from('schedules').insert([toInsert]);
		if (error) {
			addToast(`Unable to save schedule: ${error.message}`, 'error');
			return;
		}
		if (!schedules.some((schedule) => schedule.room === room && schedule.student === detail.name)) {
			schedules = [...schedules, toInsert];
		}
		you = { name: detail.name, schedule: toInsert };
		window.localStorage.setItem(room, JSON.stringify(you));
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
			name: normalizeClassName(className),
			teacher_first: normalizeTeacherName(firstName),
			teacher_last: normalizeTeacherName(lastName),
			room
		};
		const { data, error } = await supabase.from('classes').insert([payload]).select();
		if (error !== null) {
			// error.code == 23505 is duplicate entry
			if (error.code == '23505') {
				addToast('Attempted to add duplicate class', 'error');
			} else {
				addToast(`Unable to add class: ${error.message}`, 'error');
			}
			throw error;
		}
		return data![0].id;
	}
</script>

<ToastList />
{#if you === null}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<ToastList />
		<div class="modal-box max-h-screen h-fit max-w-screen overflow-visible">
			<h3 class="font-bold text-lg">But first...</h3>
			<p class="py-4">Please enter your information</p>
			<InfoInput onsubmit={onInfoSubmitted} {classes} {addClass} />
			<button
				class="btn btn-accent w-full my-4"
				onclick={() => {
					you = 'tentative';
				}}>"But I already have a schedule in here!"</button
			>
		</div>
	</dialog>
{/if}

<div class="hero ruled min-h-[25vh] border-b-2 border-dashed border-base-content/30">
	<div class="hero-content flex-col py-10">
		<h1 class="text-center font-marker text-5xl font-bold md:text-6xl">
			Room <code class="sketchy border-2 border-base-content/40 bg-base-200 px-2 py-1"
				>{room.slice(0, 8)}</code
			>
		</h1>
		<p class="opacity-70">
			{schedules.length}
			{schedules.length === 1 ? 'schedule' : 'schedules'} in this room so far
		</p>
		<!--
			Button row
		 -->
		<div class="mt-3 flex flex-wrap items-center justify-center gap-3">
			<div class="tooltip tooltip-right md:tooltip-top" data-tip="Copy room link to clipboard">
				<button
					class="btn btn-accent"
					use:copyToClipboard={{
						message: 'Room URL copied to clipboard',
						value: window.location.href
					}}
					><svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="currentColor"
						class="w-5 h-5"
					>
						<path
							fill-rule="evenodd"
							d="M10.5 3A1.501 1.501 0 009 4.5h6A1.5 1.5 0 0013.5 3h-3zm-2.693.178A3 3 0 0110.5 1.5h3a3 3 0 012.694 1.678c.497.042.992.092 1.486.15 1.497.173 2.57 1.46 2.57 2.929V19.5a3 3 0 01-3 3H6.75a3 3 0 01-3-3V6.257c0-1.47 1.073-2.756 2.57-2.93.493-.057.989-.107 1.487-.15z"
							clip-rule="evenodd"
						/>
					</svg>
					Invite
				</button>
			</div>
			<div class="tooltip" data-tip="Only show schedules with matching classes">
				<div class="form-control rounded-box bg-base-200 p-1">
					<label class="label cursor-pointer space-x-3">
						<span class="label-text">Only show matching</span>
						<input type="checkbox" class="toggle toggle-primary" bind:checked={onlyMatching} />
					</label>
				</div>
			</div>
			{#if you !== 'tentative'}
				<button
					class="btn btn-error btn-outline"
					onclick={() => {
						you = null;
						window.localStorage.removeItem(room);
					}}>Reset who you are</button
				>
			{/if}
		</div>
		{#if room == 'a0ac4ff8-46aa-41a7-834a-9dc56cd0e06e'}
			<div class="alert alert-info mx-auto mt-3 w-fit max-w-md text-sm">
				If you have any questions, direct message @thatxliner on Instagram (or email
				thatxliner@gmail.com). I can help you delete your previous submissions, etc.
			</div>
		{/if}
	</div>
</div>
<Tabs.Root value="schedules" class="min-h-[60vh]">
	<!-- <Tabs.List> -->
	{#if you === 'tentative'}
		<div class="flex w-full justify-center space-x-4">
			<h3 class="text-3xl font-bold">Select who you are</h3>
			<button
				class="btn btn-error"
				onclick={() => {
					you = null;
				}}>Cancel</button
			>
		</div>
	{:else}
		<Tabs.List class="grid w-3/4 mx-auto grid-cols-3">
			<Tabs.Trigger value="schedules">All Schedules</Tabs.Trigger>
			<Tabs.Trigger value="filter">Filter</Tabs.Trigger>
			<Tabs.Trigger value="engineer">Schedule Engineer</Tabs.Trigger>
		</Tabs.List>
	{/if}
	<Tabs.Content value="schedules">
		<ViewSchedules {schedules} bind:you {room} {getClass} {onlyMatching} />
	</Tabs.Content>
	<Tabs.Content value="filter">
		{#if you != null && you !== 'tentative'}
			<Search {you} {getClass} {schedules}></Search>
		{/if}
	</Tabs.Content>
	<Tabs.Content value="engineer">
		<Engineer {schedules} {getClass} />
	</Tabs.Content>
</Tabs.Root>

<Realtime {realtimeStatus} />
