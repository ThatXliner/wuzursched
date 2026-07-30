<script lang="ts">
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import type { UnfinishedSchedule } from '$lib/schedule';
	import type { Classes } from '../types';
	import {
		extractScheduleCandidates,
		matchCandidate,
		toUnfinishedSchedule,
		validateScheduleImage,
		type ClassMatch,
		type ScheduleCandidate
	} from '$lib/scheduleImport';
	import { isTeacherTitle, teacherDisplayName, type TeacherIdentityInput } from '$lib/teacher';
	import { formatClassName } from '$lib/utils';

	type PreviewRow = ScheduleCandidate & ClassMatch & { selectedClassId: string };
	const EXAMPLE_TEXT = '1A | AP Biology | Jane Smith\n2A | English 10 | Alex Lee';

	let {
		classes,
		addClass,
		canCreateClass = true,
		onapply
	}: {
		classes: Classes;
		addClass: (info: {
			className: string;
			identity: TeacherIdentityInput;
			lastName: string;
		}) => Promise<string>;
		canCreateClass?: boolean;
		onapply: (schedule: UnfinishedSchedule) => void;
	} = $props();

	let dialog: HTMLDialogElement;
	let sourceText = $state('');
	let rows: PreviewRow[] = $state([]);
	let error = $state('');
	let processing = $state(false);
	let confirmCreates = $state(false);
	let applying = $state(false);
	let hasUnresolved = $derived(rows.some((row) => !row.selectedClassId));
	let needsCreates = $derived(rows.some((row) => !row.selectedClassId && row.className));

	function preview(candidates: ScheduleCandidate[]) {
		rows = candidates.map((candidate) => {
			const match = matchCandidate(candidate, classes);
			return {
				...candidate,
				...match,
				selectedClassId: match.status === 'high' ? (match.classId ?? '') : ''
			};
		});
		error = rows.length
			? ''
			: 'No schedule rows found. Include periods like 1A, 2A, or 1B in the text.';
		confirmCreates = false;
	}

	function parseText() {
		preview(extractScheduleCandidates(sourceText));
	}

	async function readImage(file: File) {
		error = validateScheduleImage(file);
		if (error) return;
		processing = true;
		try {
			const form = new FormData();
			form.set('image', file);
			const response = await fetch(resolve('/api/schedule-import'), {
				method: 'POST',
				body: form
			});
			const result = (await response.json()) as {
				rows?: ScheduleCandidate[];
				error?: string;
			};
			if (!response.ok || !result.rows) {
				throw new Error(result.error || 'The schedule-reading service returned an error.');
			}
			preview(result.rows);
		} catch (reason) {
			console.error(reason);
			error =
				reason instanceof Error
					? reason.message
					: 'We could not read that image. Try a clearer screenshot or paste the schedule as text.';
		} finally {
			processing = false;
		}
	}

	function updateRow(index: number, patch: Partial<PreviewRow>) {
		const edited = { ...rows[index], ...patch };
		if ('className' in patch || 'teacherFirst' in patch || 'teacherLast' in patch) {
			const match = matchCandidate(edited, classes);
			Object.assign(edited, match, {
				selectedClassId: match.status === 'high' ? (match.classId ?? '') : ''
			});
		}
		rows[index] = edited;
		rows = [...rows];
	}

	async function applyPreview() {
		applying = true;
		error = '';
		try {
			const resolved: Array<{ period: PreviewRow['period']; classId: string }> = [];
			for (const row of rows) {
				let classId = row.selectedClassId;
				if (!classId) {
					if (!canCreateClass) {
						throw new Error('Only a room admin may add classes in this room.');
					}
					if (!confirmCreates) throw new Error('Confirm new class creation before applying.');
					if (!row.className || !row.teacherFirst || !row.teacherLast) {
						throw new Error(
							`${row.period.toUpperCase()} needs a class, the teacher's first name or title, and last name.`
						);
					}
					classId = await addClass({
						className: row.className,
						identity: isTeacherTitle(row.teacherFirst)
							? { kind: 'title', value: row.teacherFirst }
							: { kind: 'first-name', value: row.teacherFirst },
						lastName: row.teacherLast
					});
				}
				resolved.push({ period: row.period, classId });
			}
			onapply(toUnfinishedSchedule(resolved));
			dialog.close();
		} catch (reason) {
			error = reason instanceof Error ? reason.message : 'Could not apply the imported schedule.';
		} finally {
			applying = false;
		}
	}

	onMount(() => {
		const handlePaste = (event: ClipboardEvent) => {
			if (!dialog.open) return;
			const image = Array.from(event.clipboardData?.files ?? []).find((file) =>
				file.type.startsWith('image/')
			);
			if (image) {
				event.preventDefault();
				void readImage(image);
			}
		};
		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	});
</script>

<button
	class="btn btn-outline btn-secondary w-full mb-4"
	type="button"
	onclick={() => dialog.showModal()}
>
	Import screenshot or text
</button>

<dialog bind:this={dialog} class="modal">
	<div class="modal-box max-w-5xl max-h-[90vh]">
		<form method="dialog">
			<button class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2" aria-label="Close"
				>✕</button
			>
		</form>
		<h3 class="text-3xl font-bold">Import your schedule</h3>
		<p class="mt-2 text-sm">
			Screenshots are securely sent to Google’s Gemini service for AI-assisted reading and are not
			intentionally retained by Wuzursched after the request. Review every result before applying
			it. Pasted text is processed locally in your browser. See our
			<a href={resolve('/privacy')} class="link">Privacy Policy</a>.
		</p>

		<label class="mt-4 block">
			<span class="label-text font-bold">Screenshot (PNG, JPEG, or WebP; 10 MB max)</span>
			<input
				class="file-input file-input-bordered w-full"
				type="file"
				accept="image/png,image/jpeg,image/webp"
				disabled={processing}
				onchange={(event) => {
					const file = event.currentTarget.files?.[0];
					if (file) void readImage(file);
					event.currentTarget.value = '';
				}}
			/>
		</label>
		<p class="text-xs opacity-70 mt-1">You can also paste an image while this window is open.</p>

		{#if processing}
			<div class="my-4" role="status">
				<progress class="progress progress-primary w-full"></progress>
				<p>Reading image with Gemini…</p>
			</div>
		{/if}

		<label class="mt-4 block">
			<span class="label-text font-bold">Or paste schedule text</span>
			<textarea
				class="textarea textarea-bordered h-28 w-full"
				bind:value={sourceText}
				placeholder={EXAMPLE_TEXT}></textarea>
		</label>
		<button
			class="btn btn-secondary mt-2"
			type="button"
			disabled={!sourceText.trim() || processing}
			onclick={parseText}>Preview text</button
		>

		{#if error}<div class="alert alert-error mt-4" role="alert">{error}</div>{/if}

		{#if rows.length}
			<div class="overflow-x-auto mt-5">
				<table class="table table-sm">
					<thead
						><tr
							><th>Period</th><th>Class</th><th>Teacher first or title</th><th>Teacher last</th><th
								>Room class match</th
							></tr
						></thead
					>
					<tbody>
						{#each rows as row, index (row.period)}
							<tr>
								<th>{row.period.toUpperCase()}</th>
								<td
									><input
										class="input input-bordered input-sm min-w-36"
										value={row.className}
										oninput={(event) => updateRow(index, { className: event.currentTarget.value })}
									/></td
								>
								<td
									><input
										class="input input-bordered input-sm w-28"
										value={row.teacherFirst}
										oninput={(event) =>
											updateRow(index, { teacherFirst: event.currentTarget.value })}
									/></td
								>
								<td
									><input
										class="input input-bordered input-sm w-28"
										value={row.teacherLast}
										oninput={(event) =>
											updateRow(index, { teacherLast: event.currentTarget.value })}
									/></td
								>
								<td>
									<select
										class="select select-bordered select-sm min-w-52"
										value={row.selectedClassId}
										onchange={(event) =>
											updateRow(index, { selectedClassId: event.currentTarget.value })}
									>
										<option value=""
											>{canCreateClass ? 'Create as new class' : 'Choose a room class'}</option
										>
										{#each classes as klass (klass.id)}<option value={klass.id}
												>{formatClassName(klass.name)} — {teacherDisplayName(klass)}{klass.id ===
													row.classId && row.status !== 'none'
													? ` (suggested ${Math.round(row.confidence * 100)}%)`
													: ''}</option
											>{/each}
									</select>
									{#if row.status === 'high'}<span class="badge badge-success ml-2"
											>High confidence</span
										>{:else if row.status === 'uncertain'}<span class="badge badge-warning ml-2"
											>Uncertain {Math.round(row.confidence * 100)}%</span
										>{:else}<span class="badge badge-ghost ml-2">No match</span>{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			{#if canCreateClass && (needsCreates || hasUnresolved)}
				<label class="label justify-start gap-3 mt-4 cursor-pointer"
					><input
						class="checkbox checkbox-warning"
						type="checkbox"
						bind:checked={confirmCreates}
					/><span
						>I reviewed the unmatched rows and explicitly approve creating these new room classes.</span
					></label
				>
			{:else if hasUnresolved}
				<div class="alert alert-warning mt-4">
					<span
						>Choose an existing room class for every row; visitor class creation is disabled.</span
					>
				</div>
			{/if}
			<div class="modal-action">
				<button
					class="btn btn-primary"
					type="button"
					disabled={applying || (hasUnresolved && (!canCreateClass || !confirmCreates))}
					onclick={applyPreview}>{applying ? 'Applying…' : 'Apply to schedule form'}</button
				>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>Close</button></form>
</dialog>
