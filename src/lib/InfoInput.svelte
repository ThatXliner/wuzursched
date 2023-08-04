<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ClassPicker from './ClassPicker.svelte';
	import type { UnfinishedSchedule, VirtualSchedule } from './InfoInput.d';
	import type { Classes } from './InfoInput';
	import { PERIODS } from './InfoInput';
	import type { AddClassParams } from './db';
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
	$: values = PERIODS.map((period) => periods[period]);
	$: isValid =
		name.length > 0 &&
		Object.values(periods).every((x) => x !== undefined) &&
		[...new Set(values)].filter((x) => x !== null).length == values.length;
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	function submit() {
		dispatch('submit', { name, schedule: periods as VirtualSchedule });
	}
	export let classes: Classes;
	export let addClass: ({ className, firstName, lastName }: AddClassParams) => Promise<string>;
</script>

<div class="form-control">
	<label class="label justify-center">
		<span class="label-text px-3">Name</span>
		<input bind:value={name} type="text" placeholder="Bryan Hu" class="input input-bordered" />
	</label>
</div>
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<!-- We don't use details + summary tags because those will
	stay open when we click on other buttons -->
<div class="flex flex-row justify-evenly">
	<!-- TODO: no w-36 but instead a more responsive solution with
	flexbox -->
	<div class="w-36">
		{#each aDay as period}
			<ClassPicker
				bind:selected={periods[period]}
				{addClass}
				period={period.toUpperCase()}
				classes={classes.map((x) =>
					Object.assign({}, x, {
						used: values.includes(x.id) ? PERIODS[values.indexOf(x.id)] : undefined
					})
				)}
			/>
		{/each}
	</div>
	<div class="w-36">
		{#each bDay as period}
			<ClassPicker
				bind:selected={periods[period]}
				{addClass}
				period={period.toUpperCase()}
				classes={classes.map((x) =>
					Object.assign({}, x, {
						used: values.includes(x.id) ? PERIODS[values.indexOf(x.id)] : undefined
					})
				)}
			/>
		{/each}
	</div>
</div>

<div class="form-control mt-6">
	<button class="btn btn-primary" disabled={!isValid} on:click={submit}>Done</button>
</div>
