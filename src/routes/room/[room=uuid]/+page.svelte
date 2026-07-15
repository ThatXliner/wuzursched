<script lang="ts">
	import Search from './Search.svelte';

	import Realtime from '$lib/Realtime.svelte';

	import ViewSchedules from './ViewSchedules.svelte';

	import * as Tabs from '$lib/components/ui/tabs';
	import InfoInput from './components/InfoInput.svelte';

	import { page } from '$app/state';
	import {
		formatClassName,
		formatTeacherName,
		sqlEscape,
		normalizeClassName,
		normalizeTeacherName
	} from '$lib/utils';
	import { onMount } from 'svelte';

	import type { Schedule, VirtualSchedule } from '$lib/schedule';
	import type { Class, Classes, ClassWithUsage } from './types';
	import type { ActionData, PageData } from './$types';
	import memoize from 'lodash-es/memoize';
	import ToastList from '$lib/ToastList.svelte';
	import { addToast } from '$lib/toasts.svelte';
	import { copyToClipboard } from '$lib/actions';
	import type { You } from './ViewSchedules';
	import Engineer from './Engineer.svelte';
	import AdminPanel from './AdminPanel.svelte';
	import { applyDatabaseChange, replayDatabaseChanges, type DatabaseChange } from '$lib/realtime';
	import type { RealtimeChannel } from '@supabase/supabase-js';

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
	async function getClasses(room: string) {
		return await supabase.rpc('get_classes_with_usage', { room_id: room });
	}
	let you = $state<You>(null);
	let classes: Classes = $state(data.classes);
	let onlyMatching: boolean = $state(false);
	let editing = $state(false);
	let importingEditKey = $state(false);
	let importValue = $state('');
	let realtimeStatus: 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' = $state('CLOSED');
	let room = $derived(page.params.room!);
	let transferCode = $derived(
		you !== null && you !== 'tentative' && you.editToken
			? JSON.stringify({ room, student: you.name, editToken: you.editToken })
			: ''
	);
	let refreshInFlight = false;
	let refreshAgain = false;
	let scheduleEventsDuringRefresh: DatabaseChange<Schedule>[] = [];
	let classEventsDuringRefresh: DatabaseChange<Class>[] = [];
	let roomEventsDuringRefresh: DatabaseChange<typeof roomConfig>[] = [];
	let auditEventsDuringRefresh: DatabaseChange<(typeof auditLog)[number]>[] = [];

	const scheduleKey = (schedule: Partial<Schedule>) =>
		schedule.room && schedule.student ? `${schedule.room}:${schedule.student}` : undefined;
	const classKey = (classRow: Partial<Class>) => classRow.id;
	const roomKey = (roomRow: Partial<typeof roomConfig>) => roomRow.id;
	const auditKey = (auditRow: Partial<(typeof auditLog)[number]>) =>
		auditRow.id === undefined ? undefined : String(auditRow.id);

	function applyClassDatabaseChange(rows: Classes, change: DatabaseChange<Class>): Classes {
		if (change.eventType === 'DELETE') {
			return applyDatabaseChange<ClassWithUsage>(
				rows,
				{ eventType: 'DELETE', new: {}, old: change.old },
				classKey
			);
		}

		const oldId = change.eventType === 'UPDATE' ? change.old.id : undefined;
		const existing = rows.find((row) => row.id === change.new.id || row.id === oldId);
		const enriched = { ...change.new, schedule_count: existing?.schedule_count ?? 0 };
		return applyDatabaseChange<ClassWithUsage>(
			rows,
			{ eventType: change.eventType, new: enriched, old: change.old },
			classKey
		);
	}

	function replayClassDatabaseChanges(rows: Classes, changes: DatabaseChange<Class>[]): Classes {
		return changes.reduce(applyClassDatabaseChange, rows);
	}

	function persistYou(value: Exclude<You, null | 'tentative'>) {
		you = value;
		window.localStorage.setItem(room, JSON.stringify(value));
	}

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
		persistYou({ ...currentUser, schedule: currentSchedule });
	}

	function scheduleRpcArgs(name: string, schedule: VirtualSchedule) {
		return {
			p_room: room,
			p_student: name,
			p_period_1a: schedule['1a'],
			p_period_2a: schedule['2a'],
			p_period_3a: schedule['3a'],
			p_period_4a: schedule['4a'],
			p_period_1b: schedule['1b'],
			p_period_2b: schedule['2b'],
			p_period_3b: schedule['3b'],
			p_period_4b: schedule['4b']
		};
	}
	function replaceSchedule(previousStudent: string, schedule: Schedule) {
		const index = schedules.findIndex((candidate) => candidate.student === previousStudent);
		schedules =
			index === -1
				? [...schedules, schedule]
				: schedules.map((candidate, candidateIndex) =>
						candidateIndex === index ? schedule : candidate
					);
	}
	async function refreshRoom() {
		if (refreshInFlight) {
			refreshAgain = true;
			return;
		}

		refreshInFlight = true;
		scheduleEventsDuringRefresh = [];
		classEventsDuringRefresh = [];
		roomEventsDuringRefresh = [];
		auditEventsDuringRefresh = [];
		try {
			const [scheduleResult, classResult, roomResult, auditResult] = await Promise.all([
				supabase.from('schedules').select('*').eq('room', room),
				getClasses(room),
				supabase
					.from('rooms')
					.select('id, announcement, allow_class_creation, class_name_format, teacher_name_format')
					.eq('id', room)
					.single(),
				supabase
					.from('room_audit_log')
					.select('*')
					.eq('room', room)
					.order('created_at', { ascending: false })
					.limit(100)
			]);
			if (scheduleResult.error !== null) throw scheduleResult.error;
			if (classResult.error !== null) throw classResult.error;
			if (roomResult.error !== null) throw roomResult.error;
			if (auditResult.error !== null) throw auditResult.error;

			const nextSchedules = replayDatabaseChanges(
				scheduleResult.data,
				scheduleEventsDuringRefresh,
				scheduleKey
			);
			schedules = nextSchedules;
			classes = replayClassDatabaseChanges(classResult.data, classEventsDuringRefresh);
			roomConfig =
				replayDatabaseChanges([roomResult.data], roomEventsDuringRefresh, roomKey)[0] ??
				roomResult.data;
			auditLog = replayDatabaseChanges(auditResult.data, auditEventsDuringRefresh, auditKey)
				.sort((left, right) => right.created_at.localeCompare(left.created_at))
				.slice(0, 100);
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

	async function validateEditCapability() {
		if (you !== null && you !== 'tentative' && you.editToken) {
			const { data: valid, error } = await supabase.rpc('verify_schedule_edit_capability', {
				p_room: room,
				p_student: you.name,
				p_edit_token: you.editToken
			});
			if (error || !valid) {
				const readOnlyIdentity = { ...you };
				delete readOnlyIdentity.editToken;
				persistYou(readOnlyIdentity);
				addToast('This browser no longer has a valid edit key for your schedule', 'warning');
			}
		}
	}

	function applyScheduleChange(change: DatabaseChange<Schedule>) {
		if (refreshInFlight) scheduleEventsDuringRefresh.push(change);
		schedules = applyDatabaseChange(schedules, change, scheduleKey);
		if (change.eventType === 'INSERT') {
			addToast(`${change.new.student} just added their schedule to this room`);
		}
		if (
			change.eventType === 'UPDATE' &&
			you !== null &&
			you !== 'tentative' &&
			you.name === change.old.student
		) {
			persistYou({ ...you, name: change.new.student, schedule: change.new });
		} else if (change.eventType !== 'INSERT') {
			reconcileUser(schedules);
		}
		void refreshRoom();
	}

	function applyClassChange(change: DatabaseChange<Class>) {
		if (refreshInFlight) classEventsDuringRefresh.push(change);
		classes = applyClassDatabaseChange(classes, change);
		void refreshRoom();
	}

	function applyRoomChange(change: DatabaseChange<typeof roomConfig>) {
		if (refreshInFlight) roomEventsDuringRefresh.push(change);
		roomConfig = applyDatabaseChange([roomConfig], change, roomKey)[0] ?? roomConfig;
	}

	function applyAuditChange(change: DatabaseChange<(typeof auditLog)[number]>) {
		if (refreshInFlight) auditEventsDuringRefresh.push(change);
		auditLog = applyDatabaseChange(auditLog, change, auditKey)
			.sort((left, right) => right.created_at.localeCompare(left.created_at))
			.slice(0, 100);
	}

	onMount(() => {
		try {
			you = JSON.parse(window.localStorage.getItem(room) ?? 'null');
		} catch {
			recoverMissingUser();
		}
		void validateEditCapability();

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
			.on<typeof roomConfig>(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${sqlEscape(room)}` },
				(payload) => applyRoomChange(payload as DatabaseChange<typeof roomConfig>)
			)
			.on<(typeof auditLog)[number]>(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'room_audit_log',
					filter: `room=eq.${sqlEscape(room)}`
				},
				(payload) => applyAuditChange(payload as DatabaseChange<(typeof auditLog)[number]>)
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
		const { data: editToken, error } = await supabase.rpc(
			'create_schedule',
			scheduleRpcArgs(detail.name, detail.schedule)
		);
		if (error || !editToken) {
			addToast(error?.message ?? 'Could not save your schedule', 'error');
			return;
		}
		const schedule = { ...detail.schedule, room, student: detail.name };
		persistYou({ name: detail.name, schedule, editToken });
		// Realtime will add the new schedule to the shared room view.
	}
	async function updateYourSchedule(detail: { name: string; schedule: VirtualSchedule }) {
		if (you === null || you === 'tentative' || !you.editToken) return;
		const previousStudent = you.name;
		const { error } = await supabase.rpc('update_schedule', {
			...scheduleRpcArgs(detail.name, detail.schedule),
			p_current_student: previousStudent,
			p_edit_token: you.editToken
		});
		if (error) {
			addToast(error.message, 'error');
			return;
		}
		const schedule = { ...detail.schedule, room, student: detail.name };
		replaceSchedule(previousStudent, schedule);
		persistYou({ ...you, name: detail.name, schedule });
		editing = false;
		addToast('Your schedule was updated', 'success');
	}
	async function importEditKey() {
		if (you === null || you === 'tentative') return;
		let token = importValue.trim();
		try {
			const transfer = JSON.parse(token) as {
				room?: string;
				student?: string;
				editToken?: string;
			};
			if (transfer.room !== room || !transfer.editToken) {
				addToast('That transfer code belongs to a different room', 'error');
				return;
			}
			token = transfer.editToken;
		} catch {
			// A raw edit key is accepted for backwards-compatible manual transfer.
		}
		const { data: valid, error } = await supabase.rpc('verify_schedule_edit_capability', {
			p_room: room,
			p_student: you.name,
			p_edit_token: token
		});
		if (error || !valid) {
			addToast('That edit key is not valid for this schedule', 'error');
			return;
		}
		persistYou({ ...you, editToken: token });
		importingEditKey = false;
		importValue = '';
		addToast('Edit access restored on this browser', 'success');
	}
	async function rotateEditKey() {
		if (
			you === null ||
			you === 'tentative' ||
			!you.editToken ||
			!window.confirm('Replace your edit key? Any previously copied key will stop working.')
		)
			return;
		const { data: editToken, error } = await supabase.rpc('rotate_schedule_edit_capability', {
			p_room: room,
			p_student: you.name,
			p_edit_token: you.editToken
		});
		if (error || !editToken) {
			addToast(error?.message ?? 'Could not replace the edit key', 'error');
			return;
		}
		persistYou({ ...you, editToken });
		addToast('Edit key replaced; copy the new transfer code if you need a backup', 'success');
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
		const payload = {
			name:
				roomConfig.class_name_format === 'preserve'
					? className.trim()
					: roomConfig.class_name_format === 'title'
						? formatClassName(normalizeClassName(className))
						: normalizeClassName(className),
			teacher_first:
				roomConfig.teacher_name_format === 'preserve'
					? firstName.trim()
					: formatTeacherName(normalizeTeacherName(firstName)),
			teacher_last:
				roomConfig.teacher_name_format === 'preserve'
					? lastName.trim()
					: formatTeacherName(normalizeTeacherName(lastName)),
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
{#if editing && you !== null && you !== 'tentative' && you.editToken}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<div class="modal-box max-h-screen h-fit max-w-screen overflow-visible">
			<h3 class="font-bold text-lg">Edit your schedule</h3>
			<p class="py-4">Update your name or class selections.</p>
			<InfoInput
				onsubmit={updateYourSchedule}
				{classes}
				{addClass}
				initialName={you.name}
				initialSchedule={you.schedule}
				submitLabel="Save changes"
				canCreateClass={roomConfig.allow_class_creation}
				classNameFormat={roomConfig.class_name_format}
				teacherNameFormat={roomConfig.teacher_name_format}
			/>
			<button class="btn btn-ghost w-full mt-2" onclick={() => (editing = false)}>Cancel</button>
		</div>
	</dialog>
{/if}
{#if importingEditKey && you !== null && you !== 'tentative'}
	<dialog class="modal modal-bottom modal-open sm:modal-middle">
		<div class="modal-box">
			<h3 class="font-bold text-lg">Restore edit access</h3>
			<p class="py-4">
				Paste the transfer code or raw edit key you previously copied for {you.name}. The room link
				alone cannot recover edit access.
			</p>
			<textarea
				class="textarea textarea-bordered w-full font-mono"
				rows="4"
				placeholder="Paste transfer code"
				bind:value={importValue}></textarea>
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={() => (importingEditKey = false)}>Cancel</button>
				<button class="btn btn-primary" disabled={!importValue.trim()} onclick={importEditKey}
					>Restore access</button
				>
			</div>
		</div>
	</dialog>
{/if}
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
			{#if you !== null && you !== 'tentative'}
				{#if you.editToken}
					<button class="btn btn-primary" onclick={() => (editing = true)}>Edit my schedule</button>
					<button
						class="btn btn-outline"
						use:copyToClipboard={{
							message: 'Schedule transfer code copied to clipboard',
							value: transferCode
						}}>Copy edit access</button
					>
					<button class="btn btn-outline" onclick={rotateEditKey}>Replace edit key</button>
				{:else}
					<button class="btn btn-primary btn-outline" onclick={() => (importingEditKey = true)}
						>Restore edit access</button
					>
				{/if}
				<button
					class="btn btn-error btn-outline"
					onclick={() => {
						you = null;
						window.localStorage.removeItem(room);
					}}>Forget me on this browser</button
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
		{#if you !== null && you !== 'tentative'}
			<div class="alert alert-info mx-auto mt-3 max-w-2xl text-sm">
				<span>
					Your edit key is stored only in this browser. Use “Copy edit access” before clearing site
					data or moving devices. Without a copied key, the current version cannot recover access.
				</span>
			</div>
		{/if}
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
						<tr>
							<td>{new Date(entry.created_at).toLocaleString()}</td>
							<td>{entry.action} {entry.affected_table}</td>
							<td><code class="text-xs">{JSON.stringify(entry.affected_record)}</code></td>
						</tr>
					{:else}<tr><td colspan="3">No admin changes yet.</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
	</details>
{/if}

<Realtime {realtimeStatus} />
