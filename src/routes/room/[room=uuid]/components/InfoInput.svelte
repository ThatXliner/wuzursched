<script lang="ts">
	import { resolve } from '$app/paths';
	import ClassPicker from './ClassPicker.svelte';
	import ScheduleImporter from './ScheduleImporter.svelte';
	import type { UnfinishedSchedule, VirtualSchedule } from '$lib/schedule';
	import type { Classes } from '../types';

	let {
		classes,
		addClass,
		canCreateClass = true,
		classNameFormat = 'normalized',
		teacherNameFormat = 'title',
		onsubmit,
		initialName = '',
		initialSchedule,
		submitLabel = 'Submit schedule'
	}: {
		classes: Classes;
		addClass: (info: { className: string; firstName: string; lastName: string }) => Promise<string>;
		canCreateClass?: boolean;
		classNameFormat?: string;
		teacherNameFormat?: string;
		onsubmit: (detail: { name: string; schedule: VirtualSchedule }) => void | Promise<void>;
		initialName?: string;
		initialSchedule?: VirtualSchedule;
		submitLabel?: string;
	} = $props();
	function getInitialName() {
		return initialName;
	}
	function getInitialSchedule(): UnfinishedSchedule {
		return initialSchedule
			? { ...initialSchedule }
			: {
					'1a': undefined,
					'2a': undefined,
					'3a': undefined,
					'4a': undefined,
					'1b': undefined,
					'2b': undefined,
					'3b': undefined,
					'4b': undefined
				};
	}
	let name = $state(getInitialName());
	let confirmed = $state(false);
	let periods: UnfinishedSchedule = $state(getInitialSchedule());
	let submitting = $state(false);
	const PERIODS: (keyof UnfinishedSchedule)[] = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'];
	let values = $derived(PERIODS.map((period) => periods[period]));
	let isValid = $derived(
		name.length > 0 &&
			Object.values(periods).every((x) => x !== undefined) &&
			[...new Set(values)].filter((x) => x !== null).length == values.length
	);
	const aDay = ['1a', '2a', '3a', '4a'] as const;
	const bDay = ['1b', '2b', '3b', '4b'] as const;
	async function submit() {
		if (submitting) return;
		submitting = true;
		try {
			await onsubmit({ name: name.trim(), schedule: periods as VirtualSchedule });
		} finally {
			submitting = false;
		}
	}
	function applyImportedSchedule(schedule: UnfinishedSchedule) {
		periods = { ...periods, ...schedule };
		confirmed = false;
	}
</script>

<ScheduleImporter {classes} {addClass} onapply={applyImportedSchedule} />

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
	<label class="label justify-start gap-3 cursor-pointer">
		<input
			class="checkbox checkbox-primary"
			type="checkbox"
			bind:checked={confirmed}
			disabled={!isValid || submitting}
		/>
		<span>I reviewed this schedule and confirm it is ready to submit.</span>
	</label>
	<button class="btn btn-primary" disabled={!isValid || !confirmed || submitting} onclick={submit}>
		{submitting ? 'Saving…' : submitLabel}
	</button>
	<p class="mx-auto mt-3 max-w-md text-center text-sm opacity-70">
		By submitting, you agree to the <a href={resolve('/terms')} class="link">Terms of Service</a>
		and acknowledge the <a href={resolve('/privacy')} class="link">Privacy Policy</a>. Your name,
		classes, and teachers will be visible to anyone with this room link.
	</p>
</div>
