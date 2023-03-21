<script lang="ts">
	import Fuse from 'fuse.js';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { titlecase, sqlEscape, normalize } from '$lib/utils';
	import type { ArrElement } from '$lib/utils';
	import { supabase } from './db';
	async function getClasses(room: string) {
		return await supabase.from('classes').select('*').eq('room', room);
	}
	async function addClass(className: string, firstName: string, lastName: string) {
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
	type Classes = NonNullable<Awaited<ReturnType<typeof getClasses>>['data']>;
	let classes: Classes = [];
	let className = '',
		firstName = '',
		lastName = '';
	export let selected: null | ArrElement<Classes> = null;

	onMount(async () => {
		const { data, error } = await getClasses($page.params['room']);
		if (data === null) {
			throw error;
		}
		classes = data;
		supabase
			.channel('any')
			.on(
				'postgres_changes',
				{
					event: 'INSERT',
					schema: 'public',
					table: 'classes',
					// please don't let this be an SQL injection
					// (theoretically, this should never be an
					// sql injection because $page.params
					// is being validated)
					filter: `room=eq.${sqlEscape($page.params['room'])}`
				},
				(payload) => {
					console.log('Change received!', payload);
					classes = [...classes, payload.new];
				}
			)
			.subscribe();
	});
	$: searcher = new Fuse(classes, {
		keys: ['name', 'teacher_first', 'teacher_last']
	});
	$: filtered = searcher.search(className);

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
						selected = (await addClass(className, firstName, lastName))[0];
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
		<div class="overflow-y-scroll max-h-60">
			<ul class="menu z-99">
				<li class="menu-title"><span>Classes</span></li>
				{#each filtered as entry (entry.item.id)}
					{@const klass = entry.item}
					{@const isSelected = selected?.id == klass.id}
					<li
						on:click={() => {
							selected = isSelected ? null : klass;
						}}
						on:keydown={() => {
							selected = isSelected ? null : klass;
						}}
					>
						<span class:active={isSelected}
							>{titlecase(klass['name'])}
							<span class="text-sm text-gray-500" class:text-white={isSelected}
								>{titlecase(klass['teacher_first'])} {titlecase(klass['teacher_last'])}</span
							></span
						>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
