<script lang="ts">
	import Fuse from 'fuse.js';
	import type { Class } from './InfoInput';
	import { titlecase } from '$lib/utils';
	import { addToast } from './toasts';
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
	type MenuItem = Class & { used?: string };
	export let classes: MenuItem[];
	export let selected: null | string = null;
	let selectedClassName: null | string = null;
	export let period = '';
	let searcher: Fuse<MenuItem> = new Fuse([], {
		keys: ['name', 'teacher_first', 'teacher_last']
	});
	$: searcher.setCollection(classes);
	$: filtered =
		className == ''
			? classes.map((x) => {
					return { item: x };
			  })
			: searcher.search(className + firstName + lastName);
	$: classNameValid = className.length > 0;
	$: firstNameValid = /^\w+$/.test(firstName.trim());
	$: lastNameValid = /^\w+$/.test(lastName.trim().replaceAll(/\s+/g, ''));
	$: isValidClassInfo = classNameValid && firstNameValid && lastNameValid;
	let dialog: HTMLDialogElement;
</script>

<div class="tooltip" data-tip={selectedClassName ? titlecase(selectedClassName) : undefined}>
	<button
		class="btn m-1"
		class:btn-success={selected !== null}
		on:click={() => {
			dialog.showModal();
		}}>{period}</button
	>
</div>

<dialog bind:this={dialog} class="modal">
	<form method="dialog" class="modal-box">
		<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		<div class="form-control">
			<span>Search/Create a class for {period}</span>
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
					on:click={async () => {
						if (!isValidClassInfo) {
							console.log(className, firstName, lastName);
							if (!classNameValid) {
								addToast('Class name must not be empty', 'error');
							}
							if (!firstNameValid) {
								addToast("The teacher's first name must be a single word", 'error');
							}
							if (!lastNameValid) {
								addToast("The teacher's last name must not be empty", 'error');
							}
							return;
						}
						selectedClassName = className;
						selected = await addClass({
							className,
							firstName: firstName.trim(),
							lastName: lastName.trim().replaceAll(/\s+/g, '')
						});
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
			<li class="menu-title">Classes</li>
			{#each filtered as entry (entry.item.id)}
				{@const klass = entry.item}
				{@const isSelected = selected === klass.id}
				{#if entry.item?.used === undefined || selected === klass.id}
					<li
						on:click={() => {
							selected = isSelected ? null : klass.id;
							selectedClassName = isSelected ? null : klass.name;
							dialog.close();
						}}
						on:keydown={() => {
							// For accessibility, we also implement keydown
							// (this accessibility manuever should be
							// isolated into a use: directive)
							selected = isSelected ? null : klass.id;
							selectedClassName = isSelected ? null : klass.name;
							dialog.close();
						}}
					>
						<span class:active={isSelected}
							>{titlecase(klass['name'])}
							<span class="text-sm text-gray-500" class:text-white={isSelected}
								>{titlecase(klass.teacher_first)} {titlecase(klass.teacher_last)}</span
							></span
						>
					</li>
				{:else}
					<li class="disabled">
						<span
							>{titlecase(klass['name'])}
							<span class="text-sm text-gray-500"
								>{titlecase(klass.teacher_first)}
								{titlecase(klass.teacher_last)} (already used in {klass.used})</span
							></span
						>
					</li>
				{/if}
			{:else}<p>No class found. Make one!</p>
			{/each}
		</ul>
	</form>
	<!-- So that clicking outside would also close the modal -->
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
