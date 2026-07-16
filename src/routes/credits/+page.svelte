<script lang="ts">
	import { resolve } from '$app/paths';

	const names = ['Amaar Chughtai', 'Justin Shi'];
	const notes = ['bg-accent/35', 'bg-base-100'];
</script>

<section class="hero min-h-[70vh] bg-base-100 px-4 py-16">
	<div class="hero-content flex-col text-center">
		<div>
			<h1 class="text-5xl font-bold md:text-6xl">Thank you ♡</h1>
			<p class="mt-4 text-xl text-base-content/70">
				Version 2 was beta tested by these fine folks:
			</p>
		</div>
		<div class="flex flex-wrap justify-center gap-8 py-8">
			{#each names as name, i (name)}
				<div
					class="flex min-h-32 w-52 items-center justify-center rounded-2xl border border-base-300 p-5 shadow-sm {notes[
						i % notes.length
					]}"
				>
					<span class="text-2xl font-bold">{name}</span>
				</div>
			{/each}
		</div>
		<a href={resolve('/')} class="btn btn-ghost btn-lg">← Go back home</a>
	</div>
</section>
