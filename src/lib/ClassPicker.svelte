<script lang="ts">
	import type { definitions } from '$lib/db.d';
	import { page } from '$app/stores';
	import { createClient } from '@supabase/supabase-js';
	import { onMount } from 'svelte';
	import { titlecase, sqlEscape } from '$lib/utils';
	let classes: definitions['classes'][] = [];
	let className: string = '',
		firstName: string = '',
		lastName: string = '';
	export let selected: null | definitions['classes'] = null;
	const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
	const db = createClient(supabaseUrl, supabaseKey);

	onMount(async () => {
		const { data, error } = await db
			.from<definitions['classes']>('classes')
			.select('*')
			.eq('room', $page.params['room']);
		if (data === null) {
			throw error;
		}
		classes = data;
		db.from(`classes:room=eq.${sqlEscape($page.params['room'])}`)
			.on('INSERT', (payload) => {
				classes = [...classes, payload.new];
			})
			.subscribe();
	});
	$: isValid =
		className.length > 0 && /^\w+$/.test(firstName.trim()) && /^\w+$/.test(lastName.trim());
</script>

<div class="card w-96 bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="form-control">
			<label class="label">
				<span class="label-text">Create a class</span>
			</label>
			<label class="input-group">
				<input
					type="text"
					placeholder="Class name"
					class="input input-bordered w-28"
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
						const payload = {
							name: className
								.trim()
								.replace(' II', ' 2')
								.replace(/ I$/, ' 1')
								.replace(/\s+/, ' ')
								.toLowerCase(),
							teacher_first: firstName.trim().toLowerCase(),
							teacher_last: lastName.trim().toLowerCase(),
							room: $page.params['room']
						};
						const { data, error } = await db.from('classes').insert([payload]);
						className = firstName = lastName = '';
						if (error || data === null) {
							throw error;
						}
						selected = data[0];
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
		<ul class="menu w-fit max-h-28 overflow-y-scroll p-2">
			<li class="menu-title"><span>Classes</span></li>
			{#each classes as klass (klass['id'])}
				<li
					on:click={() => {
						if (selected?.id == klass.id) {
							selected = null;
						} else {
							selected = klass;
						}
					}}
				>
					<span class:active={selected?.id == klass.id}
						>{titlecase(klass['name'])}
						<span class="text-sm text-gray-500" class:text-white={selected?.id == klass.id}
							>{titlecase(klass['teacher_first'])} {titlecase(klass['teacher_last'])}</span
						></span
					>
				</li>
			{/each}
		</ul>
	</div>
</div>
