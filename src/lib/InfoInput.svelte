<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ClassPicker from './ClassPicker.svelte';
	import type { Schedule } from './InfoInput.d';
	let name: string = '';
	let periods: Schedule = {
		'1a': null,
		'2a': null,
		'3a': null,
		'4a': null,
		'1b': null,
		'2b': null,
		'3b': null,
		'4b': null
	};
	const dispatch = createEventDispatcher();
	$: values = [...Object.values(periods)];
	$: isValid =
		name.length > 0 &&
		values.every((x) => x !== null) &&
		[...new Set(values.map((x) => x!.id))].length == values.length;
</script>

<div class="form-control">
	<label class="label">
		<span class="label-text">Name</span>
		<input bind:value={name} type="text" placeholder="Bryan Hu" class="input input-bordered" />
	</label>
</div>
<div class="flex flex-row justify-evenly">
	<div class="w-36">
		{#each ['1A', '2A', '3A', '4A'] as period}
			{@const key = period.toLowerCase()}
			<div class="dropdown">
				<span tabindex="0" class="btn m-1" class:btn-success={periods[key]}>{period}</span>
				<div tabindex="0" class="dropdown-content">
					<ClassPicker bind:selected={periods[key]} />
				</div>
			</div>
		{/each}
	</div>
	<div class="w-36">
		{#each ['1B', '2B', '3B', '4B'] as period}
			{@const key = period.toLowerCase()}
			<div class="dropdown dropdown-end">
				<span tabindex="0" class="btn m-1" class:btn-success={periods[key]}>{period}</span>
				<div tabindex="0" class="dropdown-content">
					<ClassPicker bind:selected={periods[key]} />
				</div>
			</div>
		{/each}
	</div>
</div>

<div class="form-control mt-6">
	<button
		class="btn btn-primary"
		disabled={!isValid}
		on:click={() => {
			dispatch('submit', { name, schedule: periods });
		}}>Done</button
	>
</div>
