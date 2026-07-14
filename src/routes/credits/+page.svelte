<script lang="ts">
	import { resolve } from '$app/paths';

	const names = ['Amaar Chughtai', 'Justin Shi'];
	const notes = ['bg-accent/50 -rotate-2', 'bg-base-100 rotate-2'];
</script>

<section class="hero ruled min-h-[80vh]">
	<div class="hero-content flex-col text-center">
		<div>
			<h1 class="font-marker text-6xl font-bold">Thank you ♡</h1>
			<p class="mt-3 text-lg opacity-70">Version 2 was beta tested by these fine folks:</p>
		</div>
		<div class="flex flex-wrap justify-center gap-8 py-8">
			{#each names as name, i (name)}
				<div
					class="taped flex h-36 w-40 items-center justify-center p-4 shadow-md transition-transform hover:rotate-0 {notes[
						i % notes.length
					]}"
				>
					<span class="font-marker text-3xl font-bold">{name}</span>
				</div>
			{/each}
		</div>
		<a href={resolve('/')} class="btn btn-ghost sketchy">← Go back home</a>
	</div>
</section>
