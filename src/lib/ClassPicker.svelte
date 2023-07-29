<script lang="ts" context="module">
	import { supabase } from './db';
	import { writable, type Writable } from 'svelte/store';
	import type { ArrElement } from '$lib/utils';
	async function getClasses(room: string) {
		return await supabase.from('classes').select('*').eq('room', room);
	}

	type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
	type Class = ArrElement<Classes>;
	let classes: Writable<Classes> = writable([]);
</script>

<script lang="ts">
	import Fuse from 'fuse.js';
	import { titlecase, sqlEscape, normalize } from '$lib/utils';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { Database } from './supabase';
	let className = '',
		firstName = '',
		lastName = '';
	async function addClass() {
		const payload = {
			name: normalize(className),
			teacher_first: firstName.trim().toLowerCase(),
			teacher_last: lastName.trim().toLowerCase(),
			room: $page.params['room']
		};
		// XXX: Uh am I actually able to read this
		const { data, error } = await supabase.from('classes').insert([payload]).select();
		className = firstName = lastName = '';
		if (error !== null) {
			throw error;
		}
		return data;
	}

	export let selected: null | string = null;
	export let alreadySelected: string[];
	let searcher: Fuse<Class> = new Fuse([], {
		keys: ['name', 'teacher_first', 'teacher_last']
	});
	$: searcher.setCollection($classes);
	// classes.subscribe((value: Classes) => {
	// 	searcher.setCollection(value);
	// });
	onMount(async () => {
		const { data, error } = await getClasses($page.params['room']);
		if (error !== null) {
			throw error;
		}
		$classes = data;
		supabase
			.channel('any')
			.on<Database>(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'classes',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because $page.params
					// is being validated)
					filter: `room=eq.${sqlEscape($page.params['room'])}`
				},
				async (payload) => {
					// XXX: Don't fetch new, update old based on
					// payload.eventType: 'INSERT', 'DELETE', or 'UPDATE'
					const { data, error } = await getClasses($page.params['room']);
					if (error !== null) {
						throw error;
					}
					$classes = data;
				}
			)
			.subscribe();
	});
	// TODO: remove alreadySelected
	$: filtered =
		className == ''
			? $classes.map((x) => {
					return { item: x };
			  })
			: searcher.search(className);

	$: isValid =
		className.length > 0 && /^\w+$/.test(firstName.trim()) && /^\w+$/.test(lastName.trim());
</script>

<div class="card w-96 bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="form-control">
			<span>Create a class</span>
			<label class="input-group">
				<input
					type="text"
					placeholder="Class name"
					class="input input-bordered w-32"
					bind:value={className}
				/>
				<input
					type="text"
					placeholder="John"
					class="input input-bordered w-20"
					bind:value={firstName}
				/>
				<input
					type="text"
					placeholder="Doe"
					class="input input-bordered w-20"
					bind:value={lastName}
				/>
				<button
					class="btn btn-primary"
					disabled={!isValid}
					on:click={async () => {
						selected = (await addClass())[0].id;
					}}
					><svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
							clip-rule="evenodd"
						/>
					</svg></button
				></label
			>
		</div>
		<ul class="menu h-60 overflow-hidden overflow-y-scroll flex-nowrap">
			<li class="menu-title"><span>Classes</span></li>
			{#each filtered as entry (entry.item.id)}
				{@const klass = entry.item}
				{@const isSelected = selected === klass.id}
				<li
					on:click={() => {
						selected = isSelected ? null : klass.id;
					}}
					on:keydown={() => {
						selected = isSelected ? null : klass.id;
					}}
				>
					<span class:active={isSelected}
						>{titlecase(klass['name'])}
						<span class="text-sm text-gray-500" class:text-white={isSelected}
							>{titlecase(klass['teacher_first'])} {titlecase(klass['teacher_last'])}</span
						></span
					>
				</li>
			{:else}<p>No class found. Make one!</p>
			{/each}
		</ul>
		<!-- </div> -->
	</div>
</div>
