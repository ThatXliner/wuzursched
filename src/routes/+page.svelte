<script lang="ts">
	import { resolve } from '$app/paths';

	let roomId = $state('');
	const UUID_REGEX =
		/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;

	function getRoomId() {
		return roomId.match(UUID_REGEX)?.[0];
	}

	function join() {
		const id = getRoomId();
		if (id) window.location.href = `/room/${id}`;
	}
</script>

<section class="hero min-h-[calc(100vh-12rem)] bg-base-200 px-4 py-16">
	<div class="hero-content max-w-2xl text-center">
		<div>
			<h1 class="text-5xl font-bold sm:text-6xl">Wuzursched</h1>
			<p class="mx-auto max-w-xl py-6 text-lg sm:text-xl">
				Share one link with your friends and quickly find the classes you have together.
			</p>

			<div class="flex flex-col items-center justify-center gap-3 sm:flex-row">
				<a href={resolve('/create')} class="btn btn-primary btn-lg w-full sm:w-auto">
					Create a room
				</a>
				<div class="divider my-0 sm:divider-horizontal">or</div>
				<label class="join w-full max-w-md">
					<input
						type="text"
						bind:value={roomId}
						placeholder="Paste a room link or ID"
						aria-label="Room link or ID"
						class="input input-bordered input-lg join-item min-w-0 flex-1 bg-base-100"
						onkeydown={(event) => {
							if (event.key === 'Enter') join();
						}}
					/>
					<button class="btn btn-neutral btn-lg join-item" disabled={!getRoomId()} onclick={join}>
						Join
					</button>
				</label>
			</div>

			<p class="mt-6 text-sm opacity-60">No account required.</p>
		</div>
	</div>
</section>
