<script lang="ts">
	import Search from './Search.svelte';

	import Realtime from '$lib/Realtime.svelte';

	import ViewSchedules from './ViewSchedules.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import InfoInput from '$lib/InfoInput.svelte';

	import { page } from '$app/state';
	import { sqlEscape, normalize } from '$lib/utils';
	import { onMount } from 'svelte';

	import type { VirtualSchedule, Classes, Class, Schedule } from '$lib/InfoInput.d';
	import type { ActionData, PageData } from './$types';
	import memoize from 'lodash-es/memoize';
	import ToastList from '$lib/ToastList.svelte';
	import { addToast } from '$lib/toasts.svelte';
	import { copyToClipboard } from '$lib/actions';
	import type { You } from './ViewSchedules';
	import Engineer from './Engineer.svelte';
	import AdminPanel from './AdminPanel.svelte';

	let { data, form }: { data: PageData; form: ActionData | null } = $props();
	let supabase = $derived(data.supabase);
	let schedules: Schedule[] = $derived(data.data);
	let roomConfig = $derived(data.roomConfig);
	let auditLog = $derived(data.auditLog);
	async function _getClass(id: string) {
		const { data, error } = await supabase.from('classes').select('*').eq('id', id);
		if (error !== null) {
			throw error;
		}
		console.assert(data !== null);
		return data![0];
	}
	const getClass = memoize(_getClass);
	let you: You = $state()!;
	let classes: Classes = $derived(data.classes);
	let onlyMatching: boolean = $state(false);
	let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = $state('CLOSED');
	let room = $derived(page.params.room!);
	onMount(async () => {
		// Load it from localStorage
		you = JSON.parse(window.localStorage.getItem(room) ?? 'null');
		if (
			// If your log-in exists
			// But the database forgot about you
			you !== null &&
			you !== 'tentative' &&
			(
				await supabase
					.from('schedules')
					.select('*')
					.eq('room', room)
					.eq('student', you.name)
					.single()
			).data === null
		) {
			// you'll have to do the whole process again
			you = null;
			window.localStorage.removeItem(room);
			// old code:
			// let toInsert: Schedule = {
			// 	...you['schedule'],
			// 	room,
			// 	student: you.name
			// };
			// // they should be equivalent
			// console.assert(isEqual(toInsert, you.schedule));
		}
		// Supabase Realtime
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
					// sql injection because page.params
					// is being validated)
					filter: `room=eq.${sqlEscape(room)}`
				},
				(payload) => {
					if (payload.eventType === 'INSERT') {
						schedules = [...schedules, payload.new];
						addToast(`${payload.new.student} just added their schedule to this room`);
					} else if (payload.eventType === 'UPDATE') {
						schedules = schedules.map((schedule) =>
							schedule.student === payload.old.student ? payload.new : schedule
						);
					} else if (payload.eventType === 'DELETE') {
						schedules = schedules.filter((schedule) => schedule.student !== payload.old.student);
					}
				}
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
				async (payload) => {
					if (payload.eventType === 'INSERT') classes = [...classes, payload.new];
					if (payload.eventType === 'UPDATE') {
						classes = classes.map((klass) => (klass.id === payload.old.id ? payload.new : klass));
					}
					if (payload.eventType === 'DELETE') {
						classes = classes.filter((klass) => klass.id !== payload.old.id);
					}
				}
			)
			.on<typeof roomConfig>(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${sqlEscape(room)}` },
				(payload) => {
					roomConfig = payload.new;
				}
			)
			.on<(typeof auditLog)[number]>(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'room_audit_log',
					filter: `room=eq.${sqlEscape(room)}`
				},
				(payload) => {
					auditLog = [payload.new, ...auditLog].slice(0, 100);
				}
			)
			.subscribe((status) => {
				realtimeStatus = status;
			});
	});
	function onInfoSubmitted(detail: { name: string; schedule: VirtualSchedule }) {
		const toInsert = { ...detail.schedule, room, student: detail.name };
		supabase
			.from('schedules')
			.insert([toInsert])
			.then(() => {
				you = { name: detail.name, schedule: toInsert };
				// no need to update the local db variable
				// since that will be updated via the realtime subscription
				window.localStorage.setItem(room, JSON.stringify(you));
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
		if (!roomConfig.allow_class_creation) {
			addToast('Only a room admin may add classes in this room', 'error');
			throw new Error('Visitor class creation is disabled');
		}
		const formattedClass =
			roomConfig.class_name_format === 'normalized'
				? normalize(className)
				: roomConfig.class_name_format === 'title'
					? className
							.trim()
							.toLowerCase()
							.replace(/\b\w/g, (letter) => letter.toUpperCase())
					: className.trim();
		const formatTeacher = (name: string) =>
			roomConfig.teacher_name_format === 'title'
				? name
						.trim()
						.toLowerCase()
						.replace(/\b\w/g, (letter) => letter.toUpperCase())
				: name.trim();
		const payload = {
			name: formattedClass,
			teacher_first: formatTeacher(firstName),
			teacher_last: formatTeacher(lastName),
			room
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

<ToastList />
{#if you === null}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<ToastList />
		<div class="modal-box max-h-screen h-fit max-w-screen overflow-visible">
			<h3 class="font-bold text-lg">But first...</h3>
			<p class="py-4">Please enter your information</p>
			<InfoInput
				onsubmit={onInfoSubmitted}
				{classes}
				{addClass}
				canCreateClass={roomConfig.allow_class_creation}
				classNameFormat={roomConfig.class_name_format}
				teacherNameFormat={roomConfig.teacher_name_format}
			/>
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
		{#if roomConfig.announcement}
			<div class="alert alert-info mt-3 max-w-2xl whitespace-pre-wrap">
				{roomConfig.announcement}
			</div>
		{/if}
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
			{#if !data.isAdmin}
				<details class="dropdown dropdown-end">
					<summary class="btn btn-ghost">Room admin</summary>
					<form
						method="POST"
						action="?/login"
						class="card dropdown-content z-10 mt-2 w-80 border border-base-300 bg-base-100 shadow-xl"
					>
						<div class="card-body p-4">
							<label class="form-control">
								<span class="label-text">Admin credential</span>
								<input
									class="input input-bordered"
									type="password"
									name="token"
									autocomplete="off"
									required
								/>
							</label>
							<button class="btn btn-primary" type="submit">Recover admin session</button>
						</div>
					</form>
				</details>
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
			<Tabs.Trigger value="engineer" disabled>Schedule Engineer (coming soon!)</Tabs.Trigger>
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
		<Engineer {schedules} />
	</Tabs.Content>
</Tabs.Root>

{#if data.isAdmin}
	<AdminPanel {roomConfig} {classes} {schedules} {auditLog} {form} />
{:else}
	<details
		class="collapse collapse-arrow mx-auto my-8 w-11/12 max-w-5xl border border-base-300 bg-base-100"
	>
		<summary class="collapse-title text-xl font-medium">Public admin audit log</summary>
		<div class="collapse-content overflow-x-auto">
			<table class="table table-sm">
				<thead><tr><th>Time</th><th>Change</th><th>Affected record</th></tr></thead>
				<tbody>
					{#each auditLog as entry (entry.id)}
						<tr
							><td>{new Date(entry.created_at).toLocaleString()}</td><td
								>{entry.action} {entry.affected_table}</td
							><td><code class="text-xs">{JSON.stringify(entry.affected_record)}</code></td></tr
						>
					{:else}<tr><td colspan="3">No admin changes yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
{/if}

<Realtime {realtimeStatus} />
