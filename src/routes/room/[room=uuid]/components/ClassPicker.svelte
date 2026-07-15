<script lang="ts">
	import { resolve } from '$app/paths';
	import Fuse from 'fuse.js';
	import type { ClassWithUsage } from '../types';
	import { formatClassName, formatTeacherName } from '$lib/utils';
	import { addToast } from '$lib/toasts.svelte';
	import { formatClassUsage } from '$lib/classUsage';
	import { pinSelectedItem } from '$lib/classPicker';

	type MenuItem = ClassWithUsage & { used?: string };

	let {
		addClass,
		canCreateClass = true,
		classNameFormat = 'normalized',
		teacherNameFormat = 'title',
		classes,
		selected = $bindable(),
		period = ''
	}: {
		addClass: (info: { className: string; firstName: string; lastName: string }) => Promise<string>;
		canCreateClass?: boolean;
		classNameFormat?: string;
		teacherNameFormat?: string;
		classes: MenuItem[];
		selected?: string | null | undefined;
		period?: string;
	} = $props();

	let className = $state(''),
		firstName = $state(''),
		lastName = $state('');
	let selectedClassName: null | string = $state(null);
	let dialog: HTMLDialogElement;

	let searcher = $derived(
		new Fuse(classes, {
			keys: ['name', 'teacher_first', 'teacher_last']
		})
	);
	let filtered = $derived(
		pinSelectedItem(
			className == ''
				? classes.map((x) => {
						return { item: x };
					})
				: searcher.search(className + firstName + lastName),
			selected
		)
	);
	let classNameValid = $derived(className.length > 0);
	let firstNameValid = $derived(/^\w+$/.test(firstName.trim()));
	let lastNameValid = $derived(/^\w+$/.test(lastName.trim().replaceAll(/\s+/g, '')));
	let isValidClassInfo = $derived(classNameValid && firstNameValid && lastNameValid);
	const displayClass = (value: string) =>
		classNameFormat === 'preserve' ? value : formatClassName(value);
	const displayTeacher = (first: string, last: string) => {
		const value = `${first} ${last}`;
		return teacherNameFormat === 'preserve' ? value : formatTeacherName(value);
	};
</script>

<div class="tooltip" data-tip={selectedClassName ? displayClass(selectedClassName) : undefined}>
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
		{#if canCreateClass}
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
						onclick={async (event) => {
							if (!isValidClassInfo) {
								console.log(className, firstName, lastName);
								if (!classNameValid) addToast('Class name must not be empty', 'error');
								if (!firstNameValid) {
									addToast("The teacher's first name must be a single word", 'error');
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
								firstName: firstName.trim(),
								lastName: lastName.trim().replaceAll(/\s+/g, '')
							});
							className = '';
							firstName = '';
							lastName = '';
						}}
						aria-label="Create class"
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
		<ul class="menu h-60 overflow-hidden overflow-y-scroll flex-nowrap">
			<li class="menu-title">Classes</li>
			{#each filtered as entry (entry.item.id)}
				{@const klass = entry.item}
				{@const isSelected = selected === klass.id}
				{#if entry.item?.used === undefined || selected === klass.id}
					<li
						onclick={() => {
							selected = isSelected ? null : klass.id;
							selectedClassName = isSelected ? null : klass.name;
							dialog.close();
						}}
						onkeydown={() => {
							selected = isSelected ? null : klass.id;
							selectedClassName = isSelected ? null : klass.name;
							dialog.close();
						}}
					>
						<span class:active={isSelected}
							>{displayClass(klass.name)}
							<span class="text-sm text-gray-500" class:text-white={isSelected}
								>{displayTeacher(klass.teacher_first, klass.teacher_last)} ·
								{formatClassUsage(klass.schedule_count)}</span
							></span
						>
					</li>
				{:else}
					<li class="disabled">
						<span
							>{displayClass(klass.name)}
							<span class="text-sm text-gray-500"
								>{displayTeacher(klass.teacher_first, klass.teacher_last)} ·
								{formatClassUsage(klass.schedule_count)} (already used in {klass.used})</span
							></span
						>
					</li>
				{/if}
			{:else}<p>No class found.{canCreateClass ? ' Make one!' : ''}</p>
			{/each}
		</ul>
	</form>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
