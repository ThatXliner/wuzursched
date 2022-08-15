<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import ClassPicker from './ClassPicker.svelte';
	import type { Schedule } from './InfoInput.d';
	let name: string = '';
	let periods: Schedule = {
		'1a': {
			id: '8b2098d8-59d2-406d-8ada-55fc994550ce',
			name: 'bible 8',
			teacher_first: 'john',
			teacher_last: 'delke',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'2a': {
			id: 'e44b1ee7-9346-4beb-a08a-f65280b94555',
			name: 'band 2',
			teacher_first: 'shane',
			teacher_last: 'ryan',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'3a': {
			id: 'ca70c336-f30c-4b9f-a79a-43b8e3b02862',
			name: 'pltw space and electricity',
			teacher_first: 'dwain',
			teacher_last: 'fairweather',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'4a': {
			id: '70a928a3-b7e0-4583-b1af-c8af4bbe9126',
			name: 'physical science',
			teacher_first: 'michael',
			teacher_last: 'pond',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'1b': {
			id: '08b6e7b7-0ffc-4d11-86a7-b37d4700386d',
			name: 'boys pe 7/8',
			teacher_first: 'shea',
			teacher_last: 'coleman',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'2b': {
			id: '45098bed-503e-4c99-8158-bd90212d2653',
			name: 'history 8',
			teacher_first: 'dwain',
			teacher_last: 'fairweather',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

		'3b': {
			id: '279966c2-44c3-4f85-9892-83b8e355f11a',
			name: 'algebra 2 honors',
			teacher_first: 'dan',
			teacher_last: 'yuen',
			room: '99df5949-3947-4342-a5b0-d8260925528d'
		},

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
