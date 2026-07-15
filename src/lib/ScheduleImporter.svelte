<script lang="ts">
	import { onMount } from 'svelte';
	import type { Classes, UnfinishedSchedule } from './InfoInput';
	import {
		extractScheduleCandidates,
		matchCandidate,
		toUnfinishedSchedule,
		validateScheduleImage,
		type ClassMatch,
		type ScheduleCandidate
	} from './scheduleImport';
	import { isTeacherTitle, teacherDisplayName, type TeacherIdentityInput } from './teacher';
	import { formatClassName } from './utils';

	type PreviewRow = ScheduleCandidate & ClassMatch & { selectedClassId: string };
	const EXAMPLE_TEXT = '1A | AP Biology | Jane Smith\n2A | English 10 | Alex Lee';

	let {
		classes,
		addClass,
		onapply
	}: {
		classes: Classes;
		addClass: (info: {
			className: string;
			identity: TeacherIdentityInput;
			lastName: string;
		}) => Promise<string>;
		onapply: (schedule: UnfinishedSchedule) => void;
	} = $props();

	let dialog: HTMLDialogElement;
	let sourceText = $state('');
	let rows: PreviewRow[] = $state([]);
	let error = $state('');
	let processing = $state(false);
	let progress = $state(0);
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
		progress = 0;
		let worker: Awaited<ReturnType<(typeof import('tesseract.js'))['createWorker']>> | undefined;
		try {
			const { createWorker } = await import('tesseract.js');
			worker = await createWorker('eng', 1, {
				logger: (message) => {
					if (typeof message.progress === 'number') progress = Math.round(message.progress * 100);
				}
			});
			const result = await worker.recognize(file);
			sourceText = result.data.text;
			preview(extractScheduleCandidates(sourceText));
		} catch (reason) {
			console.error(reason);
			error =
				'We could not read that image. Try a clearer screenshot or paste the schedule as text.';
		} finally {
			await worker?.terminate();
			processing = false;
			progress = 0;
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
			Your image is read locally in this browser and is never uploaded to Wuzursched or an OCR
			service. It is discarded as soon as processing finishes. OCR may download its language model.
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
				<progress class="progress progress-primary w-full" value={progress} max="100"></progress>
				<p>Reading image… {progress}%</p>
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
										<option value="">Create as new class</option>
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
			{#if needsCreates || hasUnresolved}
				<label class="label justify-start gap-3 mt-4 cursor-pointer"
					><input
						class="checkbox checkbox-warning"
						type="checkbox"
						bind:checked={confirmCreates}
					/><span
						>I reviewed the unmatched rows and explicitly approve creating these new room classes.</span
					></label
				>
			{/if}
			<div class="modal-action">
				<button
					class="btn btn-primary"
					type="button"
					disabled={applying || (hasUnresolved && !confirmCreates)}
					onclick={applyPreview}>{applying ? 'Applying…' : 'Apply to schedule form'}</button
				>
			</div>
		{/if}
	</div>
	<form method="dialog" class="modal-backdrop"><button>Close</button></form>
</dialog>
