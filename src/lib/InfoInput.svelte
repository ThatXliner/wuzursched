<script lang="ts">
	import ClassPicker from './ClassPicker.svelte';
	import type { UnfinishedSchedule, VirtualSchedule } from './InfoInput.d';
	import type { Classes } from './InfoInput';

	let {
		classes,
		addClass,
		canCreateClass = true,
		classNameFormat = 'normalized',
		teacherNameFormat = 'title',
		onsubmit
	}: {
		classes: Classes;
		addClass: (info: { className: string; firstName: string; lastName: string }) => Promise<string>;
		canCreateClass?: boolean;
		classNameFormat?: string;
		teacherNameFormat?: string;
		onsubmit: (detail: { name: string; schedule: VirtualSchedule }) => void;
	} = $props();

	let name = $state('');
	let periods: UnfinishedSchedule = $state({
		'1a': undefined,
		'2a': undefined,
		'3a': undefined,
		'4a': undefined,
		'1b': undefined,
		'2b': undefined,
		'3b': undefined,
		'4b': undefined
	});
	const PERIODS: (keyof UnfinishedSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
	let values = $derived(PERIODS.map((period) => periods[period]));
	let isValid = $derived(
		name.length > 0 &&
			Object.values(periods).every((x) => x !== undefined) &&
			[...new Set(values)].filter((x) => x !== null).length == values.length
	);
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	function submit() {
		onsubmit({ name: name.trim(), schedule: periods as VirtualSchedule });
	}
</script>

<div class="form-control">
	<label class="label justify-center">
		<span class="label-text px-3">Name</span>
		<input bind:value={name} type="text" placeholder="Bryan Hu" class="input input-bordered" />
	</label>
</div>
<!-- We don't use details + summary tags because those will
	stay open when we click on other buttons -->
<div class="flex flex-row justify-evenly">
	<!-- TODO: no w-36 but instead a more responsive solution with
	flexbox -->
	<div class="w-36">
		{#each aDay as period (period)}
			<ClassPicker
				bind:selected={periods[period]}
				{addClass}
				{canCreateClass}
				{classNameFormat}
				{teacherNameFormat}
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
		{#each bDay as period (period)}
			<ClassPicker
				bind:selected={periods[period]}
				{addClass}
				{canCreateClass}
				{classNameFormat}
				{teacherNameFormat}
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
	<button class="btn btn-primary" disabled={!isValid} onclick={submit}>Done</button>
</div>
