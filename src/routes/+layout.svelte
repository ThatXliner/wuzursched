<script>
	import '../app.css';
	import { resolve } from '$app/paths';
	import { ModeWatcher, mode, theme, setTheme } from 'mode-watcher';

	let { children } = $props();

	// mode-watcher owns the data-theme attribute on <html>, which blocks
	// daisyUI's prefers-color-scheme fallback — so pick the daisyUI theme
	// through mode-watcher (it persists it and applies it before first paint)
	$effect(() => {
		const wanted = mode.current === 'dark' ? 'chalkboard' : 'paper';
		if (theme.current !== wanted) setTheme(wanted);
	});
</script>

<ModeWatcher />

<div class="flex min-h-screen flex-col bg-base-100 text-base-content">
	<div class="w-full bg-base-200 py-1.5 text-center font-marker text-lg opacity-80">
		<a href="https://vcsdclub.org" class="link-hover">
			scribbled together by the Valley Christian Software Development Club →
		</a>
	</div>

	<header
		class="navbar sticky top-0 z-40 border-b-2 border-dashed border-base-content/30 bg-base-100/90 px-4 backdrop-blur md:px-8"
	>
		<div class="navbar-start">
			<a href={resolve('/')} class="flex items-center gap-2">
				<!-- Placeholder scribble "W" — to be replaced by the real hand-drawn logo -->
				<svg
					viewBox="0 0 32 32"
					class="h-8 w-8"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					aria-hidden="true"
				>
					<path
						d="M4 7c1 4 2.2 12.5 4 18.5c.6 2 2.6 2 3.4.2C13 21.5 14.5 16 15.8 12c1.3 4 2.6 9.5 4.3 13.7c.8 1.8 2.8 1.8 3.4-.2c1.8-6 3.2-14.5 4.5-18.5"
					/>
				</svg>
				<span class="font-marker text-3xl font-bold">Wuzursched</span>
			</a>
		</div>
		<div class="navbar-end gap-2">
			<a href={resolve('/credits')} class="btn btn-ghost btn-sm hidden sm:inline-flex">Credits</a>
			<a href={resolve('/create')} class="btn btn-outline btn-primary btn-sm sketchy border-2"
				>Create a room</a
			>
			<a
				href="https://github.com/ThatXliner/wuzursched"
				class="btn btn-ghost btn-square btn-sm"
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

	<footer
		class="footer footer-center gap-4 border-t-2 border-dashed border-base-content/30 bg-base-200 p-8"
	>
		<aside class="flex flex-col items-center gap-1">
			<p class="font-marker text-2xl font-bold">Wuzursched</p>
			<p class="opacity-70">What's your schedule?</p>
			<p class="text-sm opacity-70">
				Copyright © 2023 ThatXliner · Licensed under the
				<a href="https://github.com/ThatXliner/wuzursched/blob/main/LICENSE" class="link">AGPLv3</a>
			</p>
		</aside>
		<nav class="flex gap-5">
			<a href={resolve('/')} class="link link-hover">Home</a>
			<a href={resolve('/create')} class="link link-hover">Create a room</a>
			<a href={resolve('/credits')} class="link link-hover">Credits</a>
			<a href="https://github.com/ThatXliner/wuzursched" class="link link-hover">Source code</a>
		</nav>
	</footer>
</div>
