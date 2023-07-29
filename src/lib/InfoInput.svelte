<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ClassPicker from './ClassPicker.svelte';
	import type { UnfinishedSchedule, VirtualSchedule } from './InfoInput.d';
	let name = '';
	let periods: UnfinishedSchedule = {
		'1a': undefined,
		'2a': undefined,
		'3a': undefined,
		'4a': undefined,
		'1b': undefined,
		'2b': undefined,
		'3b': undefined,
		'4b': undefined
	};
	const dispatch = createEventDispatcher();
	$: values = [...Object.values(periods)];
	$: isValid =
		name.length > 0 &&
		Object.values(periods).every((x) => x !== undefined) &&
		[...new Set(values)].length == values.length;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	function submit() {
		dispatch('submit', { name, schedule: periods as VirtualSchedule });
	}
</script>

<div class="form-control">
	<label class="label">
		<span class="label-text">Name</span>
		<input bind:value={name} type="text" placeholder="Bryan Hu" class="input input-bordered" />
	</label>
</div>
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div class="flex flex-row justify-evenly">
	<div class="w-36">
		{#each aDay as period}
			<div class="dropdown">
				<span tabindex="0" class="btn m-1" class:btn-success={periods[period] != undefined}
					>{period.toUpperCase()}</span
				>
				<div tabindex="0" class="dropdown-content">
					<ClassPicker bind:selected={periods[period]} alreadySelected={values} />
				</div>
			</div>
		{/each}
	</div>
	<div class="w-36">
		{#each bDay as period}
			<div class="dropdown dropdown-end">
				<span tabindex="0" class="btn m-1" class:btn-success={periods[period] != undefined}
					>{period.toUpperCase()}</span
				>
				<div tabindex="0" class="dropdown-content">
					<ClassPicker bind:selected={periods[period]} alreadySelected={values} />
				</div>
			</div>
		{/each}
	</div>
</div>

<div class="form-control mt-6">
	<button class="btn btn-primary" disabled={!isValid} on:click={submit}>Done</button>
</div>
