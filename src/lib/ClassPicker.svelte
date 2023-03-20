<script lang="ts">
	import Fuse from 'fuse.js';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { titlecase, sqlEscape } from '$lib/utils';
	import { supabase } from './db';
	async function getClasses(room: string) {
		return await supabase.from('classes').select('*').eq('room', room);
	}
	let classes: NonNullable<Awaited<ReturnType<typeof getClasses>>['data']> = [];
	let className: string = '',
		firstName: string = '',
		lastName: string = '';
	export let selected: null | any = null;

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
	$: filtered = className.length == 0 ? classes : searcher.search(className);
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
						// TODO: Seperate to utility
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
						const { data, error } = await supabase.from('classes').insert([payload]);
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
		<div class="overflow-y-scroll max-h-60">
			<ul class="menu z-99">
				<li class="menu-title"><span>Classes</span></li>
				{#each filtered as entry (entry?.item?.id ?? entry.id)}
					{@const klass = entry?.item ?? entry}
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
</div>
