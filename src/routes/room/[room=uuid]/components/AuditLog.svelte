<script lang="ts">
	let {
		entries,
		pageSize = 10
	}: {
		entries: Array<{
			id: number;
			created_at: string;
			action: string;
			affected_table: string;
			affected_record: unknown;
		}>;
		pageSize?: number;
	} = $props();

	let currentPage = $state(1);
	let totalPages = $derived(Math.max(1, Math.ceil(entries.length / pageSize)));
	let pageEntries = $derived(entries.slice((currentPage - 1) * pageSize, currentPage * pageSize));
	let firstEntry = $derived(entries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1);
	let lastEntry = $derived(Math.min(currentPage * pageSize, entries.length));

	$effect(() => {
		if (currentPage > totalPages) currentPage = totalPages;
	});
</script>

<div class="overflow-x-auto">
	<table class="table table-sm min-w-2xl">
		<thead><tr><th>Time</th><th>Action</th><th>Record</th></tr></thead>
		<tbody>
			{#each pageEntries as entry (entry.id)}
				<tr>
					<td class="whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
					<td>{entry.action} {entry.affected_table}</td>
					<td class="max-w-xl">
						<code class="break-all whitespace-pre-wrap text-xs"
							>{JSON.stringify(entry.affected_record)}</code
						>
					</td>
				</tr>
			{:else}
				<tr><td colspan="3">No admin changes yet.</td></tr>
			{/each}
		</tbody>
	</table>
</div>

{#if entries.length > 0}
	<nav
		class="mt-4 flex flex-wrap items-center justify-between gap-3"
		aria-label="Audit log pagination"
	>
		<p class="text-sm opacity-70">Showing {firstEntry}–{lastEntry} of {entries.length}</p>
		<div class="join">
			<button
				type="button"
				class="btn join-item btn-sm"
				aria-label="Previous audit log page"
				disabled={currentPage === 1}
				onclick={() => (currentPage -= 1)}>Previous</button
			>
			<span class="btn join-item btn-sm pointer-events-none" aria-current="page">
				Page {currentPage} of {totalPages}
			</span>
			<button
				type="button"
				class="btn join-item btn-sm"
				aria-label="Next audit log page"
				disabled={currentPage === totalPages}
				onclick={() => (currentPage += 1)}>Next</button
			>
		</div>
	</nav>
{/if}
