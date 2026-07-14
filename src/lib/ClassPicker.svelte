<script lang="ts">
	import Fuse from 'fuse.js';
	import type { Class } from './InfoInput';
	import { titlecase } from '$lib/utils';
	import { addToast } from './toasts.svelte';
	import {
		isValidTeacherFirstName,
		isValidTeacherLastName,
		isTeacherTitle,
		teacherDisplayName,
		teacherSearchText,
		TEACHER_TITLES,
		type TeacherIdentityInput,
		type TeacherTitle
	} from './teacher';

	type MenuItem = Class & { used?: string };

	let {
		addClass,
		classes,
		selected = $bindable(),
		period = ''
	}: {
		addClass: (info: {
			className: string;
			identity: TeacherIdentityInput;
			lastName: string;
		}) => Promise<string>;
		classes: MenuItem[];
		selected?: string | null | undefined;
		period?: string;
	} = $props();

	let className = $state(''),
		firstName = $state(''),
		lastName = $state('');
	let identityKind = $state<TeacherIdentityInput['kind']>('first-name');
	let selectedTitle = $state<TeacherTitle>('Mr');
	let selectedClassName: null | string = $state(null);
	let dialog: HTMLDialogElement;

	let searchableClasses = $derived(
		classes.map((klass) => ({
			...klass,
			search_text: `${klass.name} ${teacherSearchText(klass)}`
		}))
	);
	let searcher = $derived(
		new Fuse(searchableClasses, {
			keys: ['search_text']
		})
	);
	let filtered = $derived(
		className === '' && firstName === '' && lastName === ''
			? searchableClasses.map((x) => {
					return { item: x };
				})
			: searcher.search(
					[className, identityKind === 'first-name' ? firstName : selectedTitle, lastName].join(' ')
				)
	);
	let classNameValid = $derived(className.trim().length > 0);
	let identityValid = $derived(identityKind === 'title' || isValidTeacherFirstName(firstName));
	let lastNameValid = $derived(isValidTeacherLastName(lastName));
	let isValidClassInfo = $derived(classNameValid && identityValid && lastNameValid);
</script>

<div class="tooltip" data-tip={selectedClassName ? titlecase(selectedClassName) : undefined}>
	<button
		class="btn m-1"
		class:btn-success={selected != null}
		onclick={() => {
			dialog.showModal();
		}}>{period}</button
	>
</div>

<dialog bind:this={dialog} class="modal">
	<form method="dialog" class="modal-box">
		<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		<div class="form-control">
			<span>Search/Create a class for {period}</span>
			<label class="join flex-wrap">
				<input
					type="text"
					placeholder="Class name"
					class="input input-bordered w-32 join-item"
					bind:value={className}
				/>
				<select
					aria-label="Teacher name type"
					class="select select-bordered join-item"
					bind:value={identityKind}
				>
					<option value="first-name">First name</option>
					<option value="title">Title</option>
				</select>
				{#if identityKind === 'first-name'}
					<input
						type="text"
						aria-label="Teacher first name"
						placeholder="Jane"
						class="input input-bordered w-24 join-item"
						bind:value={firstName}
					/>
				{:else}
					<select
						aria-label="Teacher title"
						class="select select-bordered join-item"
						bind:value={selectedTitle}
					>
						{#each TEACHER_TITLES as title (title)}
							<option value={title}>{title}</option>
						{/each}
					</select>
				{/if}
				<input
					type="text"
					aria-label="Teacher last name"
					placeholder="Arild"
					class="input input-bordered w-24 join-item"
					bind:value={lastName}
				/>
				<button
					aria-label="Create class"
					class="btn btn-primary join-item"
					onclick={async (event) => {
						if (!isValidClassInfo) {
							if (!classNameValid) {
								addToast('Class name must not be empty', 'error');
							}
							if (!identityValid) {
								addToast(
									isTeacherTitle(firstName)
										? 'Choose “Title” to enter a teacher title'
										: "The teacher's first name must be a single word",
									'error'
								);
							}
							if (!lastNameValid) {
								addToast("The teacher's last name must not be empty", 'error');
							}
							event.preventDefault();
							return;
						}
						selectedClassName = className;
						selected = await addClass({
							className,
							identity:
								identityKind === 'first-name'
									? { kind: 'first-name', value: firstName }
									: { kind: 'title', value: selectedTitle },
							lastName
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
					<li>
						<button
							type="button"
							class:active={isSelected}
							onclick={() => {
								selected = isSelected ? null : klass.id;
								selectedClassName = isSelected ? null : klass.name;
								dialog.close();
							}}
							>{titlecase(klass['name'])}
							<span class="text-sm text-gray-500" class:text-white={isSelected}
								>{teacherDisplayName(klass)}</span
							></button
						>
					</li>
				{:else}
					<li class="disabled">
						<span
							>{titlecase(klass['name'])}
							<span class="text-sm text-gray-500"
								>{teacherDisplayName(klass)} (already used in {klass.used})</span
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
