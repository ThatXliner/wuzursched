<script lang="ts">
	import Fuse from 'fuse.js';
	import type { Class, Classes } from './InfoInput';
	import { titlecase } from '$lib/utils';
	let className = '',
		firstName = '',
		lastName = '';
	export let addClass: ({
		className,
		firstName,
		lastName
	}: {
		className: string;
		firstName: string;
		lastName: string;
	}) => Promise<string>;
	export let classes: Classes;
	export let selected: null | string = null;
	let searcher: Fuse<Class> = new Fuse([], {
		keys: ['name', 'teacher_first', 'teacher_last']
	});
	$: searcher.setCollection(classes);
	$: filtered =
		className == ''
			? classes.map((x) => {
					return { item: x };
			  })
			: searcher.search(className);

	$: isValidClassInfo =
		className.length > 0 && /^\w+$/.test(firstName.trim()) && /^\w+$/.test(lastName.trim());
</script>

<div class="card w-96 bg-base-100 shadow-xl">
	<div class="card-body">
		<div class="form-control">
			<span>Search/Create a class</span>
			<label class="join">
				<input
					type="text"
					placeholder="Class name"
					class="input input-bordered w-32 join-item"
					bind:value={className}
				/>
				<input
					type="text"
					placeholder="John"
					class="input input-bordered w-20 join-item"
					bind:value={firstName}
				/>
				<input
					type="text"
					placeholder="Doe"
					class="input input-bordered w-20 join-item"
					bind:value={lastName}
				/>
				<button
					class="btn btn-primary join-item"
					disabled={!isValidClassInfo}
					on:click={async () => {
						selected = await addClass({ className, firstName, lastName });
						// Reset the search
						className = '';
						firstName = '';
						lastName = '';
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
							>{titlecase(klass.teacher_first)} {titlecase(klass.teacher_last)}</span
						></span
					>
				</li>
			{:else}<p>No class found. Make one!</p>
			{/each}
		</ul>
	</div>
</div>
