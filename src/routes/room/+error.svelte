<script lang="ts">
	import { page } from '$app/stores';
	console.error($page.error.message);
</script>

{#if $page.status === 404}
	<main class="hero h-screen">
		<div class="hero-content flex-col">
			<div class="alert alert-error shadow-lg">
				<div>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="stroke-current flex-shrink-0 h-6 w-6"
						fill="none"
						viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
						/></svg
					>
					<span>Non-existent room lmao L</span>
				</div>
			</div>
			<a href="/" class="btn btn-primary">Ok I got bozo'd, bring me back home</a>
		</div>
	</main>
{/if}
