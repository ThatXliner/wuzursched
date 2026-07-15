<script lang="ts">
	import type { Class, Schedule } from '$lib/InfoInput';
	import { engineerSchedules, PERIODS, type Period, type ScheduleLocks } from '$lib/engineer';
	import { formatClassName } from '$lib/utils';

	let { schedules, getClass }: { schedules: Schedule[]; getClass: (id: string) => Promise<Class> } =
		$props();
	let selected: Schedule[] = $state([]);
	let studentToAdd = $state('');
	let locksByStudent: Record<string, { periods: Period[]; classes: string[] }> = $state({});

	let available = $derived(
		schedules.filter((schedule) => !selected.some((x) => x.student === schedule.student))
	);
	let result = $derived(
		engineerSchedules(
			selected.map((schedule) => ({
				student: schedule.student,
				schedule,
				locks: locksByStudent[schedule.student] satisfies ScheduleLocks | undefined
			}))
		)
	);
	let hasIncompleteSchedule = $derived(
		selected.some((schedule) => PERIODS.some((period) => !schedule[period]))
	);

	function addStudent() {
		const schedule = schedules.find((candidate) => candidate.student === studentToAdd);
		if (!schedule || selected.some((candidate) => candidate.student === schedule.student)) return;
		selected = [...selected, schedule];
		studentToAdd = '';
	}

	function removeStudent(student: string) {
		selected = selected.filter((schedule) => schedule.student !== student);
		const remainingLocks = { ...locksByStudent };
		delete remainingLocks[student];
		locksByStudent = remainingLocks;
	}

	function toggleLock(student: string, kind: 'periods' | 'classes', value: string) {
		const current = locksByStudent[student] ?? { periods: [], classes: [] };
		const values = current[kind] as string[];
		const nextValues = values.includes(value)
			? values.filter((candidate) => candidate !== value)
			: [...values, value];
		locksByStudent = {
			...locksByStudent,
			[student]: { ...current, [kind]: nextValues }
		};
	}

	function isLocked(student: string, kind: 'periods' | 'classes', value: string) {
		return (locksByStudent[student]?.[kind] as string[] | undefined)?.includes(value) ?? false;
	}
</script>

<section class="mx-auto w-11/12 max-w-6xl py-8">
	<header class="mb-6 text-center">
		<h2 class="font-marker text-4xl font-bold md:text-5xl">Schedule Engineer</h2>
		<p class="mx-auto mt-3 max-w-3xl opacity-75">
			Choose an anchor student and friends, then preview the fewest schedule moves needed to
			maximize the classes they can share. This is a planning tool: stored schedules are never
			changed.
		</p>
	</header>

	<div class="rounded-box border border-base-300 bg-base-200 p-4 shadow-sm">
		<label class="mb-2 block font-semibold" for="engineer-student">Add a student</label>
		<div class="flex flex-col gap-2 sm:flex-row">
			<select
				id="engineer-student"
				class="select select-bordered grow"
				bind:value={studentToAdd}
				disabled={available.length === 0}
			>
				<option value="">{available.length ? 'Choose a student…' : 'Everyone is selected'}</option>
				{#each available as schedule (schedule.student)}
					<option value={schedule.student}>{schedule.student}</option>
				{/each}
			</select>
			<button class="btn btn-primary" disabled={!studentToAdd} onclick={addStudent}
				>Add student</button
			>
		</div>
		<p class="mt-2 text-sm opacity-70">
			The first student is the anchor. We maximize their shared placements with everyone else, then
			minimize total moves; exact ties use a stable alphabetical ordering.
		</p>
	</div>

	{#if selected.length === 0}
		<div class="alert mt-6">
			<span>Select at least one student to start building a proposal.</span>
		</div>
	{:else}
		{#if hasIncompleteSchedule}
			<div class="alert alert-warning mt-6">
				<span
					>Incomplete schedules are included; empty periods remain available for moved classes.</span
				>
			</div>
		{/if}

		<div class="mt-6 space-y-4">
			{#each selected as schedule, index (schedule.student)}
				<article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
					<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
						<h3 class="text-2xl font-bold">
							{schedule.student}
							{#if index === 0}<span class="badge badge-primary align-middle">Anchor</span>{/if}
						</h3>
						<button
							class="btn btn-sm btn-error btn-outline"
							onclick={() => removeStudent(schedule.student)}
						>
							Remove
						</button>
					</div>
					<p class="mb-3 text-sm opacity-70">
						Lock a period to keep its current slot unchanged, or lock a class so that class cannot
						move.
					</p>
					<div class="overflow-x-auto">
						<table class="table table-sm">
							<thead
								><tr
									><th>Period</th><th>Current class</th><th>Lock period</th><th>Lock class</th></tr
								></thead
							>
							<tbody>
								{#each PERIODS as period (period)}
									{@const classId = schedule[period]}
									<tr>
										<th>{period.toUpperCase()}</th>
										<td>
											{#if classId}
												{#await getClass(classId)}
													<span class="loading loading-dots loading-xs"></span>
												{:then resolvedClass}
													{formatClassName(resolvedClass.name)}
												{:catch}
													<span class="font-mono text-xs">{classId}</span>
												{/await}
											{:else}<span class="opacity-50">Empty</span>{/if}
										</td>
										<td>
											<input
												type="checkbox"
												class="checkbox checkbox-sm"
												aria-label={`Lock ${schedule.student}'s ${period.toUpperCase()} period`}
												checked={isLocked(schedule.student, 'periods', period)}
												onchange={() => toggleLock(schedule.student, 'periods', period)}
											/>
										</td>
										<td>
											<input
												type="checkbox"
												class="checkbox checkbox-sm"
												aria-label={`Lock ${schedule.student}'s class in ${period.toUpperCase()}`}
												disabled={!classId}
												checked={Boolean(classId) && isLocked(schedule.student, 'classes', classId)}
												onchange={() => classId && toggleLock(schedule.student, 'classes', classId)}
											/>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</article>
			{/each}
		</div>

		{#if result.status === 'no-solution'}
			<div class="alert alert-error mt-6">
				<span>No proposal is possible: {result.reason}</span>
			</div>
		{:else if result.status === 'success'}
			<section class="mt-8" aria-live="polite">
				<h3 class="font-marker text-3xl font-bold">Proposed schedules</h3>
				<div
					class="stats stats-vertical mt-3 w-full border border-base-300 shadow sm:stats-horizontal"
				>
					<div class="stat">
						<div class="stat-title">Shared placements</div>
						<div class="stat-value text-primary">{result.sharedPlacements}</div>
						<div class="stat-desc">Anchor-to-friend class matches</div>
					</div>
					<div class="stat">
						<div class="stat-title">Movement cost</div>
						<div class="stat-value">{result.movementCost}</div>
						<div class="stat-desc">One point per class moved</div>
					</div>
				</div>

				<div class="mt-5 grid gap-4 lg:grid-cols-2">
					{#each result.schedules as proposal (proposal.student)}
						<article class="rounded-box border border-base-300 bg-base-100 p-4 shadow-sm">
							<h4 class="text-xl font-bold">{proposal.student}</h4>
							<div class="mt-2 overflow-x-auto">
								<table class="table table-sm">
									<thead><tr><th>Period</th><th>Proposed class</th></tr></thead>
									<tbody>
										{#each PERIODS as period (period)}
											{@const classId = proposal.proposed[period]}
											<tr class:bg-warning={classId !== proposal.original[period]}>
												<th>{period.toUpperCase()}</th>
												<td>
													{#if classId}
														{#await getClass(classId)}
															<span class="loading loading-dots loading-xs"></span>
														{:then resolvedClass}
															{formatClassName(resolvedClass.name)}
														{:catch}<span class="font-mono text-xs">{classId}</span>{/await}
													{:else}<span class="opacity-50">Empty</span>{/if}
												</td>
											</tr>
										{/each}
									</tbody>
								</table>
							</div>
							<div class="mt-3">
								<p class="font-semibold">Required moves ({proposal.moves.length})</p>
								{#if proposal.moves.length === 0}
									<p class="text-sm opacity-70">No changes needed.</p>
								{:else}
									<ul class="list-disc pl-5 text-sm">
										{#each proposal.moves as move (`${move.classId}-${move.from}-${move.to}`)}
											<li>
												{#await getClass(move.classId) then resolvedClass}
													{formatClassName(resolvedClass.name)}
												{:catch}{move.classId}{/await}:
												{move.from.toUpperCase()} → {move.to.toUpperCase()}
											</li>
										{/each}
									</ul>
								{/if}
							</div>
						</article>
					{/each}
				</div>
				<div class="alert alert-info mt-5">
					<span>This proposal is a preview only. No stored schedule has been modified.</span>
				</div>
			</section>
		{/if}
	{/if}
</section>
