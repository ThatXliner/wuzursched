<script lang="ts">
	const names = ['Amaar Chughtai', 'Justin Shi'];
</script>

<section class="h-screen">
	<div class="hero min-h-screen bg-base-200 h-full">
		<div class="hero-content text-center flex-col">
			<div>
				<h1 class="text-5xl font-bold">Version 2</h1>
				<p>was beta tested by:</p>
			</div>
			<div class="flex flex-wrap space-x-3 text-lg py-6">
				{#each names as name}<span class="shadow-lg rounded-box p-3 bg-base-100">{name}</span
					>{/each}
			</div>
			<a href="/" class="link">Go back home</a>
		</div>
	</div>
</section>
