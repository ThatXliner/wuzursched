<script lang="ts">
	let roomId: string;
	function isValid(id: string): boolean {
		return /[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}/.test(
			id
		);
	}
</script>

<section class="h-screen">
	<!-- <section class="h-[50vh]"> -->
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
						<label class="input-group">
							<input
								type="text"
								bind:value={roomId}
								placeholder="Join a room"
								class="input input-bordered"
							/>
							<button
								class="btn btn-primary"
								disabled={!isValid(roomId)}
								on:click={() => {
									window.location.href = `/room/${roomId.trim()}`;
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
<!-- <section class="h-screen">
	<div class="hero h-full bg-base-100">
		<div class="hero-content flex-col lg:flex-row">
			<img src="https://placeimg.com/260/400/arch" class="max-w-[50%] rounded-lg shadow-2xl" />
			<div>
				<h1 class="text-4xl">Never stress about first day</h1>
				<p class="py-6">
					Figure who you share classes with, fast. Invite your friends to participate
				</p>
				<a href="/powerschool" class="m-auto btn btn-primary">Get Started</a>
			</div>
		</div>
	</div>
</section> -->
