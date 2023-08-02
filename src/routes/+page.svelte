<script lang="ts">
	let roomId: string;
	const UUID_REGEX =
		/[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/;
	function isValid(id: string): boolean {
		return UUID_REGEX.test(id);
	}
</script>

<section class="h-screen">
	<div class="hero h-full bg-gray-200 dark:bg-zinc-900">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<h1
					class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-fuchsia-500"
				>
					Wuzursched
				</h1>

				<i class="py-6 dark:text-gray-300 font-mono block">What's your schedule?</i>
				<div class="flex justify-evenly space-x-5">
					<div class="form-control inline-block">
						<label class="join">
							<input
								type="text"
								bind:value={roomId}
								placeholder="Join a room"
								class="input input-bordered join-item"
							/>
							<button
								class="btn btn-primary join-item"
								disabled={!isValid(roomId)}
								on:click={() => {
									window.location.href = `/room/${roomId.match(UUID_REGEX)?.[0]}`;
								}}>Join</button
							>
						</label>
					</div>
					<a href="/create" class="btn btn-primary">Create a room</a>
				</div>
			</div>
		</div>
	</div>
</section>
