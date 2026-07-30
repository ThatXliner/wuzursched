<script lang="ts">
	import { resolve } from '$app/paths';
	import Fuse from 'fuse.js';
	import type { ClassWithUsage } from '../types';
	import { formatClassName } from '$lib/utils';
	import { addToast } from '$lib/toasts.svelte';
	import { formatClassUsage } from '$lib/classUsage';
	import {
		isValidTeacherFirstName,
		isValidTeacherLastName,
		isTeacherTitle,
		teacherDisplayName,
		teacherSearchText,
		TEACHER_TITLES,
		type TeacherIdentityInput,
		type TeacherTitle
	} from '$lib/teacher';
	import { pinSelectedItem } from '$lib/classPicker';
	import { tick } from 'svelte';

	type MenuItem = ClassWithUsage & { used?: string };

	let {
		addClass,
		canCreateClass = true,
		classNameFormat = 'normalized',
		teacherNameFormat = 'title',
		classes,
		selected = $bindable(),
		period = '',
		updateSelected
	}: {
		addClass: (info: {
			className: string;
			identity: TeacherIdentityInput;
			lastName: string;
		}) => Promise<string>;
		canCreateClass?: boolean;
		classNameFormat?: string;
		teacherNameFormat?: string;
		classes: MenuItem[];
		selected?: string | null | undefined;
		period?: string;
		updateSelected?: (selected: string | null) => void;
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
	let searcher = $derived(new Fuse(searchableClasses, { keys: ['search_text'] }));
	let filtered = $derived(
		pinSelectedItem(
			className === '' && firstName === '' && lastName === ''
				? searchableClasses.map((item) => ({ item }))
				: searcher.search(
						[className, identityKind === 'first-name' ? firstName : selectedTitle, lastName].join(
							' '
						)
					),
			selected
		)
	);
	let classNameValid = $derived(className.trim().length > 0);
	let identityValid = $derived(identityKind === 'title' || isValidTeacherFirstName(firstName));
	let lastNameValid = $derived(isValidTeacherLastName(lastName));
	let isValidClassInfo = $derived(classNameValid && identityValid && lastNameValid);
	const displayClass = (value: string) =>
		classNameFormat === 'preserve' ? value : formatClassName(value);
	const displayTeacher = (teacher: ClassWithUsage) =>
		teacherNameFormat === 'preserve'
			? `${teacher.teacher_first ?? teacher.teacher_title ?? ''} ${teacher.teacher_last}`.trim()
			: teacherDisplayName(teacher);
	function select(value: string | null) {
		selected = value;
		updateSelected?.(value);
	}
</script>

<div
	class="tooltip w-full"
	data-tip={selectedClassName ? displayClass(selectedClassName) : undefined}
>
	<button class="btn w-full" class:btn-success={selected != null} onclick={() => dialog.showModal()}
		>{period}</button
	>
</div>

<dialog bind:this={dialog} class="modal">
	<form
		method="dialog"
		class="modal-box rounded-box w-[calc(100%-2rem)] max-w-2xl overflow-visible p-5 sm:p-6"
	>
		<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
		{#if canCreateClass}
			<div class="form-control">
				<h3 class="pr-10 text-lg font-semibold">Search or create a class for {period}</h3>
				<div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-12">
					<input
						type="text"
						placeholder="Class name"
						aria-label="Class name"
						class="input input-bordered col-span-2 w-full sm:col-span-4"
						bind:value={className}
					/>
					<select
						aria-label="Teacher name type"
						class="select select-bordered col-span-2 w-full sm:col-span-3"
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
							class="input input-bordered w-full sm:col-span-2"
							bind:value={firstName}
						/>
					{:else}
						<select
							aria-label="Teacher title"
							class="select select-bordered w-full sm:col-span-2"
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
						class="input input-bordered w-full sm:col-span-2"
						bind:value={lastName}
					/>
					<button
						type="button"
						class="btn btn-primary col-span-2 sm:col-span-1"
						aria-label="Create class"
						onclick={async (event) => {
							if (!isValidClassInfo) {
								if (!classNameValid) addToast('Class name must not be empty', 'error');
								if (!identityValid) {
									addToast(
										isTeacherTitle(firstName)
											? 'Choose “Title” to enter a teacher title'
											: "The teacher's first name must be a single word",
										'error'
									);
								}
								if (!lastNameValid) addToast("The teacher's last name must not be empty", 'error');
								event.preventDefault();
								return;
							}
							try {
								select(
									await addClass({
										className,
										identity:
											identityKind === 'first-name'
												? { kind: 'first-name', value: firstName }
												: { kind: 'title', value: selectedTitle },
										lastName
									})
								);
								selectedClassName = className;
								className = '';
								firstName = '';
								lastName = '';
								await tick();
								dialog.close();
							} catch {
								// addClass reports a user-facing error; keep the dialog open.
							}
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
					>
				</div>
				<p class="mt-2 text-sm opacity-70">
					Creating a class publishes its name and teacher to everyone with the room link. See our
					<a href={resolve('/privacy')} class="link">Privacy Policy</a>.
				</p>
			</div>
		{:else}
			<p class="text-sm opacity-70">
				Search the admin-maintained class list. Visitor class creation is disabled.
			</p>
		{/if}
		<ul class="menu mt-2 h-60 flex-nowrap overflow-y-auto p-0">
			<li class="menu-title">Classes</li>
			{#each filtered as entry (entry.item.id)}
				{@const klass = entry.item}
				{@const isSelected = selected === klass.id}
				{#if klass.used === undefined || isSelected}
					<li>
						<button
							type="button"
							class:active={isSelected}
							onclick={async () => {
								select(isSelected ? null : klass.id);
								selectedClassName = isSelected ? null : klass.name;
								await tick();
								dialog.close();
							}}
							>{displayClass(klass.name)}
							<span class="text-sm text-gray-500" class:text-white={isSelected}
								>{displayTeacher(klass)} · {formatClassUsage(klass.schedule_count)}</span
							></button
						>
					</li>
				{:else}
					<li class="disabled">
						<span
							>{displayClass(klass.name)}
							<span class="text-sm text-gray-500"
								>{displayTeacher(klass)} ·
								{formatClassUsage(klass.schedule_count)} (already used in {klass.used})</span
							></span
						>
					</li>
				{/if}
			{:else}<p>No class found.{canCreateClass ? ' Make one!' : ''}</p>
			{/each}
		</ul>
	</form>
	<form method="dialog" class="modal-backdrop"><button>close</button></form>
</dialog>
