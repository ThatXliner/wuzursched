<script lang="ts">
	/** @type {import('./$types').PageData */
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/db';
	import { titlecase, sqlEscape } from '$lib/utils';
	import InfoInput from '$lib/InfoInput.svelte';
	import type { Database } from '$lib/supabase';
	export let data;
	let schedules = data.schedules;
	async function getClass(id: string) {
		let { data, error } = await supabase.from('classes').select('*').eq('id', id);
		if (error || data === null) {
			throw error;
		}
		return data[0];
	}
	let you: null | {
		name: string;
		schedule: Database['public']['Tables']['schedules']['Row'];
	} = null;
	onMount(async () => {
		you = JSON.parse(window.localStorage.getItem($page.params['room']) ?? 'null');
		if (
			you !== null &&
			(
				await supabase
					.from('schedules')
					.select('*')
					.eq('room', $page.params['room'])
					.eq('student', you['name'])
			).data?.length == 0
		) {
			let toInsert = { room: $page.params['room'], student: you.name };
			for (const x of ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b']) {
				toInsert[x] = you['schedule'][x].id;
			}
			await supabase.from('schedules').insert([toInsert]);
		}

		supabase
			.channel('any')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'schedules',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because $page.params
					// is being validated)
					filter: `room=eq.${sqlEscape($page.params['room'])}`
				},
				(payload) => {
					console.log('Change received!', payload);
					schedules = [...schedules, payload.new];
				}
			)
			.subscribe();
	});
</script>

{#if you === null}
	<div class="modal modal-bottom modal-open sm:modal-middle">
		<div class="modal-box max-h-screen h-3/4 max-w-screen overflow-x-hidden">
			<h3 class="font-bold text-lg">But first...</h3>
			<p class="py-4">Please enter your information</p>
			<InfoInput
				on:submit={(event) => {
					const got = event.detail;
					let toInsert = { room: $page.params['room'], student: got.name };
					for (const x of ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b']) {
						toInsert[x] = got['schedule'][x].id;
					}
					// @ts-ignore
					supabase
						.from('schedules')
						.insert([toInsert])
						.then(() => {
							you = got;
							window.localStorage.setItem($page.params['room'], JSON.stringify(you));
						});
				}}
			/>
		</div>
	</div>
{/if}
<main class="hero min-h-[30vh]">
	<div class="hero-content flex-col">
		<h1 class="text-5xl text-center font-bold">
			Schedules for room <code>{$page.params['room'].slice(0, 8)}</code>
		</h1>
		<div class="flex justify-evenly flex-row space-x-4">
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
			><button class="btn btn-primary mx-auto" disabled>Find common classes</button>
		</div>
	</div>
</main>
<div>
	<div class="flex flex-wrap space-x-4 justify-evenly">
		{#each schedules as schedule}
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
						<table class="table w-full">
							<thead>
								<tr class="text-center">
									<th />
									<th>A day</th>
									<th>B day</th>
								</tr>
							</thead>
							<tbody>
								{#each ['1', '2', '3', '4'] as period}
									{@const scheduleA = schedule[period + 'a']}
									{@const scheduleB = schedule[period + 'b']}
									{@const classA = getClass(scheduleA)}
									{@const classB = getClass(scheduleB)}
									{@const aInCommon = you && you['schedule'][period + 'a']?.id == scheduleA}
									{@const bInCommon = you && you['schedule'][period + 'b']?.id == scheduleB}
									{@const resolved = Promise.all([classA, classB])}
									{#await resolved then [classA, classB]}
										<!-- row 1 -->
										<tr>
											<th>Period {period}</th>
											<td
												><div
													class="rounded-box p-2 py-3 w-fit"
													class:bg-success={aInCommon}
													class:text-success-content={aInCommon}
												>
													<span
														>{titlecase(classA['name'])}
														<span class="text-xs text-gray-500"
															>{titlecase(classA['teacher_first'])}
															{titlecase(classA['teacher_last'])}</span
														></span
													>
												</div></td
											>
											<td
												><div
													class="rounded-box p-2 py-3 w-fit"
													class:bg-success={bInCommon}
													class:text-success-content={bInCommon}
												>
													<span
														>{titlecase(classB['name'])}
														<span class="text-xs text-gray-500"
															>{titlecase(classB['teacher_first'])}
															{titlecase(classB['teacher_last'])}</span
														></span
													>
												</div></td
											>
										</tr>
									{/await}
								{/each}
							</tbody>
						</table>
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
</div>

<style>
	input[type='checkbox']:checked ~ .collapse-content {
		display: block;
	}
</style>
