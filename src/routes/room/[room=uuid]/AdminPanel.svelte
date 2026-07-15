<script lang="ts">
	import type { Class, Schedule } from '$lib/InfoInput';

	let {
		roomConfig,
		classes,
		schedules,
		auditLog,
		form
	}: {
		roomConfig: {
			announcement: string;
			allow_class_creation: boolean;
			class_name_format: string;
			teacher_name_format: string;
		};
		classes: Class[];
		schedules: Schedule[];
		auditLog: Array<{
			id: number;
			created_at: string;
			action: string;
			affected_table: string;
			affected_record: unknown;
		}>;
		form?: { message?: string; transferToken?: string } | null;
	} = $props();

	const periods = ['1a', '2a', '3a', '4a', '1b', '2b', '3b', '4b'] as const;
</script>

<section class="mx-auto my-8 w-11/12 max-w-5xl space-y-6">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<div>
			<h2 class="font-marker text-4xl font-bold">Room administration</h2>
			<p class="opacity-70">Your admin session is stored securely on this device.</p>
		</div>
		<form method="POST" action="?/logout">
			<button class="btn btn-ghost">Leave admin mode</button>
		</form>
	</div>

	{#if form?.message}
		<div class="alert alert-info"><span>{form.message}</span></div>
	{/if}
	{#if form?.transferToken}
		<div class="alert alert-warning block">
			<p class="font-bold">Copy this one-time transfer credential now.</p>
			<p>
				Entering it on another device transfers admin access. The old credential no longer works.
			</p>
			<code class="mt-2 block break-all select-all rounded bg-base-300 p-3"
				>{form.transferToken}</code
			>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-2">
		<form method="POST" action="?/settings" class="card border border-base-300 bg-base-100 shadow">
			<div class="card-body">
				<h3 class="card-title">Room settings</h3>
				<label class="form-control">
					<span class="label-text">Announcement or naming guide</span>
					<textarea class="textarea textarea-bordered" maxlength="2000" name="announcement"
						>{roomConfig.announcement}</textarea
					>
				</label>
				<label class="label cursor-pointer justify-start gap-3">
					<input
						class="toggle toggle-primary"
						type="checkbox"
						name="allow_class_creation"
						checked={roomConfig.allow_class_creation}
					/>
					<span>Visitors may create classes</span>
				</label>
				<label class="form-control">
					<span class="label-text">Class names</span>
					<select
						class="select select-bordered"
						name="class_name_format"
						value={roomConfig.class_name_format}
					>
						<option value="normalized">Normalized lowercase</option>
						<option value="title">Title case</option>
						<option value="preserve">Preserve input</option>
					</select>
				</label>
				<label class="form-control">
					<span class="label-text">Teacher names</span>
					<select
						class="select select-bordered"
						name="teacher_name_format"
						value={roomConfig.teacher_name_format}
					>
						<option value="title">Title case</option>
						<option value="preserve">Preserve input</option>
					</select>
				</label>
				<button class="btn btn-primary" type="submit">Save settings</button>
			</div>
		</form>

		<form
			method="POST"
			action="?/seed"
			enctype="multipart/form-data"
			class="card border border-base-300 bg-base-100 shadow"
		>
			<div class="card-body">
				<h3 class="card-title">Seed classes</h3>
				<p class="text-sm opacity-70">
					CSV columns: class name, teacher first name, teacher last name. A header is optional.
				</p>
				<textarea
					class="textarea textarea-bordered min-h-32"
					name="class_list"
					placeholder="Biology,Jane,Doe&#10;Calculus,Alan,Turing"></textarea>
				<label class="form-control">
					<span class="label-text">Or upload a CSV file</span>
					<input
						class="file-input file-input-bordered"
						type="file"
						name="class_file"
						accept=".csv,text/csv"
					/>
				</label>
				<button class="btn btn-primary" type="submit">Import classes</button>
			</div>
		</form>
	</div>

	<div class="card border border-base-300 bg-base-100 shadow">
		<div class="card-body">
			<h3 class="card-title">Moderate schedules</h3>
			{#each schedules as schedule (schedule.student)}
				<details class="collapse collapse-arrow border border-base-300">
					<summary class="collapse-title font-medium">{schedule.student}</summary>
					<div class="collapse-content space-y-3">
						<form method="POST" action="?/updateSchedule" class="space-y-3">
							<input type="hidden" name="original_student" value={schedule.student} />
							<input
								class="input input-bordered w-full"
								name="student"
								value={schedule.student}
								required
							/>
							<div class="grid grid-cols-2 gap-2 md:grid-cols-4">
								{#each periods as period (period)}
									<label class="form-control">
										<span class="label-text uppercase">{period}</span>
										<select
											class="select select-bordered"
											name={period}
											value={schedule[period]}
											required
										>
											{#each classes as klass (klass.id)}
												<option value={klass.id}>{klass.name} — {klass.teacher_last}</option>
											{/each}
										</select>
									</label>
								{/each}
							</div>
							<button class="btn btn-primary" type="submit">Save schedule</button>
						</form>
						<form method="POST" action="?/deleteSchedule">
							<input type="hidden" name="student" value={schedule.student} />
							<button class="btn btn-error btn-outline" type="submit">Delete schedule</button>
						</form>
					</div>
				</details>
			{:else}
				<p class="opacity-70">No schedules have been submitted.</p>
			{/each}
		</div>
	</div>

	<div class="card border border-base-300 bg-base-100 shadow">
		<div class="card-body">
			<h3 class="card-title">Transfer or revoke admin access</h3>
			<p>
				Rotating creates a new credential, revokes every previous copy, and keeps this device signed
				in.
			</p>
			<form method="POST" action="?/rotate">
				<button class="btn btn-warning" type="submit">Rotate and show transfer credential</button>
			</form>
		</div>
	</div>

	<div class="card border border-base-300 bg-base-100 shadow">
		<div class="card-body">
			<h3 class="card-title">Public audit log</h3>
			<div class="overflow-x-auto">
				<table class="table table-sm">
					<thead><tr><th>Time</th><th>Action</th><th>Record</th></tr></thead>
					<tbody>
						{#each auditLog as entry (entry.id)}
							<tr>
								<td>{new Date(entry.created_at).toLocaleString()}</td>
								<td>{entry.action} {entry.affected_table}</td>
								<td><code class="text-xs">{JSON.stringify(entry.affected_record)}</code></td>
							</tr>
						{:else}
							<tr><td colspan="3">No admin changes yet.</td></tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</section>
