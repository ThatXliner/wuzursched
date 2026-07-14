<script lang="ts">
	import { resolve } from '$app/paths';

	let roomId: string = $state('');
	const UUID_REGEX =
		/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;
	function isValid(id: string): boolean {
		return UUID_REGEX.test(id);
	}
	function join() {
		window.location.href = `/room/${roomId.match(UUID_REGEX)?.[0]}`;
	}

	const steps = [
		{
			title: 'Create a room',
			description: 'One click, no account needed. You get a link that anyone can join.',
			tilt: '-rotate-1'
		},
		{
			title: 'Share the link',
			description: 'Send it to your friends, your group chat, or your whole grade.',
			tilt: 'rotate-1'
		},
		{
			title: 'Compare instantly',
			description: 'Everyone enters their schedule once. Shared classes get highlighted, live.',
			tilt: '-rotate-1'
		}
	];

	const features = [
		{
			title: 'Live updates',
			description: 'Schedules appear the moment someone submits them. No refreshing.',
			tilt: 'rotate-1'
		},
		{
			title: 'Shared classes, highlighted',
			description:
				"Every schedule is compared against yours, so you don't have to squint at screenshots."
		},
		{
			title: 'Search and filter',
			description: 'Find a friend by name, or only show people who share a class with you.',
			tilt: '-rotate-1'
		},
		{
			title: 'No sign-up, no nonsense',
			description: 'No accounts, no emails, no app. A room is just a link.'
		}
	];
</script>

<!-- Hero: a page torn out of a notebook -->
<section class="ruled relative border-b-2 border-dashed border-base-content/30">
	<div class="hero min-h-[80vh]">
		<div class="hero-content flex-col text-center">
			<div class="max-w-2xl">
				<h1 class="font-marker text-7xl font-bold tracking-tight md:text-8xl">Wuzursched</h1>
				<!-- hand-drawn underline squiggle -->
				<svg
					viewBox="0 0 300 14"
					class="mx-auto -mt-1 w-64 text-base-content/70 md:w-80"
					fill="none"
					stroke="currentColor"
					stroke-width="3"
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d="M4 8 C40 2, 70 12, 110 7 S 190 3, 230 9 S 280 6, 296 5" />
				</svg>

				<p class="mt-5 text-xl opacity-80">
					<em>What's your schedule?</em>
					<span class="text-base opacity-70">(pronounced "wuzz-yer-sked")</span>
				</p>
				<p class="mx-auto mt-3 max-w-lg text-lg opacity-75">
					Make a room, pass the link around like a note in class, and
					<mark class="bg-accent/60 px-1 text-base-content">see who's in your classes</mark> — no screenshots,
					no accounts.
				</p>

				<div
					class="mt-10 flex flex-col items-center justify-center gap-3 md:flex-row md:items-stretch"
				>
					<a href={resolve('/create')} class="btn btn-outline btn-primary btn-lg sketchy border-2"
						>Create a room</a
					>
					<div class="divider divider-horizontal hidden font-marker text-xl md:flex">or</div>
					<label class="join">
						<input
							type="text"
							bind:value={roomId}
							placeholder="Paste a room link or ID"
							class="input input-bordered input-lg join-item w-64 border-2 border-base-content/40 bg-base-100"
							onkeydown={(e) => {
								if (e.key === 'Enter' && isValid(roomId)) join();
							}}
						/>
						<button
							class="btn btn-lg join-item border-2 border-base-content/40"
							disabled={!isValid(roomId)}
							onclick={join}>Join</button
						>
					</label>
				</div>

				<p class="mt-6 font-marker text-lg opacity-60">realtime · no accounts · free forever</p>

				<a
					href={resolve('/credits')}
					class="link link-hover mt-4 inline-block font-marker text-lg opacity-60"
					>credits to our beta testers ♡</a
				>
			</div>
		</div>
	</div>
</section>

<!-- How it works: index cards -->
<section class="bg-base-200 py-20">
	<div class="mx-auto max-w-5xl px-6">
		<h2 class="text-center font-marker text-5xl font-bold">How it works</h2>
		<div class="mt-14 grid gap-8 md:grid-cols-3">
			{#each steps as step, i (step.title)}
				<div
					class="card sketchy taped border-2 border-base-content/50 bg-base-100 shadow-sm {step.tilt}"
				>
					<div class="card-body items-center text-center">
						<div
							class="sketchy-alt flex h-12 w-12 items-center justify-center border-2 border-base-content/60 font-marker text-3xl font-bold"
						>
							{i + 1}
						</div>
						<h3 class="card-title font-marker text-3xl">{step.title}</h3>
						<p class="opacity-75">{step.description}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Features: margin notes -->
<section class="py-20">
	<div class="mx-auto max-w-4xl px-6">
		<h2 class="text-center font-marker text-5xl font-bold">Why Wuzursched?</h2>
		<div class="mt-14 grid gap-8 sm:grid-cols-2">
			{#each features as feature (feature.title)}
				<div
					class="sketchy border-2 border-base-content/50 bg-base-100 p-6 shadow-sm {feature.tilt ??
						''}"
				>
					<h3 class="font-marker text-3xl font-bold">{feature.title}</h3>
					<p class="mt-2 opacity-75">{feature.description}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Final CTA -->
<section class="ruled border-t-2 border-dashed border-base-content/30 py-20">
	<div class="hero-content mx-auto flex-col text-center">
		<h2 class="font-marker text-5xl font-bold">Ready when you are.</h2>
		<a href={resolve('/create')} class="btn btn-outline btn-primary btn-lg sketchy mt-6 border-2"
			>Create a room</a
		>
	</div>
</section>
