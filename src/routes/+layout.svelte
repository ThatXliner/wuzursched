<script>
	import '../app.css';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<div class="flex min-h-screen flex-col bg-base-100 text-base-content">
	<div
		class="w-full bg-neutral px-4 py-2 text-center text-sm text-neutral-content"
	>
		<a href="https://vcsdclub.org" class="link link-hover">
			Built by the Valley Christian Software Development Club
		</a>
	</div>

	<header class="navbar border-b border-base-300 bg-base-100 px-4 md:px-8">
		<div class="navbar-start">
			<a href={resolve('/')} class="btn btn-ghost text-xl">Wuzursched</a>
		</div>
		<div class="navbar-end gap-2">
			<a href={resolve('/credits')} class="btn btn-ghost hidden sm:inline-flex">Credits</a>
			<a href={resolve('/create')} class="btn btn-primary">Create a room</a>
			<a
				href="https://github.com/ThatXliner/wuzursched"
				class="btn btn-ghost btn-square"
				aria-label="GitHub repository"
				><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
					><path
						fill="currentColor"
						d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33c.85 0 1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"
					/></svg
				></a
			>
		</div>
	</header>

	<main class="flex-1">
		{@render children()}
	</main>

	<footer class="footer footer-center gap-3 border-t border-base-300 bg-base-100 p-6">
		<aside>
			<p class="text-sm opacity-70">
				Copyright © 2023 ThatXliner · Licensed under the
				<a href="https://github.com/ThatXliner/wuzursched/blob/main/LICENSE" class="link">AGPLv3</a>
			</p>
		</aside>
		<nav class="flex flex-wrap justify-center gap-x-5 gap-y-2">
			<a href={resolve('/')} class="link link-hover">Home</a>
			<a href={resolve('/create')} class="link link-hover">Create a room</a>
			<a href={resolve('/credits')} class="link link-hover">Credits</a>
			<a href={resolve('/terms')} class="link link-hover">Terms</a>
			<a href={resolve('/privacy')} class="link link-hover">Privacy</a>
			<a href="https://github.com/ThatXliner/wuzursched" class="link link-hover">Source code</a>
		</nav>
	</footer>
</div>
