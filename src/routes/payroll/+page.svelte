<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { tick } from 'svelte';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';

	let { data }: PageProps = $props();

	type PayoutRow = { employeeName: string; amount: number | null };
	type BatchRow = PayoutRow & { include: boolean };
	type Message = { type: 'success' | 'error'; text: string } | null;
	type PayoutSet = (typeof data.sets)[number];

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const pesoFormat = new Intl.NumberFormat('en-PH', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
	const peso = (amount: number) => `₱${pesoFormat.format(amount)}`;

	function ymd(date: Date): string {
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	// Same Sunday to Saturday weeks as the Sales page
	function currentWeek() {
		const start = new Date();
		start.setDate(start.getDate() - start.getDay());
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return { start: ymd(start), end: ymd(end) };
	}

	function displayDate(value: string | null): string {
		if (!value) return '';
		const [y, m, d] = value.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	const isBlank = (row: PayoutRow) => !row.employeeName.trim() && row.amount === null;
	const isValid = (row: PayoutRow) =>
		row.employeeName.trim() !== '' && row.amount !== null && row.amount > 0;
	const totalOf = (rows: PayoutRow[]) =>
		rows.reduce((cents, row) => cents + (isValid(row) ? Math.round(row.amount! * 100) : 0), 0) /
		100;
	const toPayload = (rows: PayoutRow[]) =>
		JSON.stringify(
			rows.map((row) => ({ employeeName: row.employeeName.trim(), amount: row.amount }))
		);

	const resultMessage = (result: { data?: Record<string, unknown> }, fallback: string) =>
		String(result.data?.message ?? result.data?.error ?? fallback);

	// History month picker
	let selectedMonth = $state(new Date().getMonth() + 1);
	let selectedYear = $state(new Date().getFullYear());
	$effect.pre(() => {
		selectedMonth = data.currentMonth;
		selectedYear = data.currentYear;
	});

	// ---------- Saved payout sets ----------
	let setMessage = $state<Message>(null);
	let editor = $state<{ setId: number | null; setName: string; rows: PayoutRow[] } | null>(null);
	let editorSection = $state<HTMLElement>();

	const editorRows = $derived(editor ? editor.rows.filter((row) => !isBlank(row)) : []);
	const editorReady = $derived(
		!!editor &&
			editor.setName.trim() !== '' &&
			editorRows.length > 0 &&
			editorRows.every(isValid)
	);

	async function openEditor(next: NonNullable<typeof editor>) {
		editor = next;
		setMessage = null;
		await tick();
		editorSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function newSet() {
		openEditor({ setId: null, setName: '', rows: [{ employeeName: '', amount: null }] });
	}

	function editSet(set: PayoutSet) {
		openEditor({
			setId: set.setId,
			setName: set.setName,
			rows: set.items.map((item) => ({ ...item }))
		});
	}

	function addEditorRow() {
		editor?.rows.push({ employeeName: '', amount: null });
	}

	function removeEditorRow(index: number) {
		editor?.rows.splice(index, 1);
	}

	// ---------- Generate payroll ----------
	const week = currentWeek();
	let batchMessage = $state<Message>(null);
	let duplicateWarning = $state<string | null>(null);
	let generateSection = $state<HTMLElement>();
	let batch = $state({
		setId: '',
		payDate: ymd(new Date()),
		periodStart: week.start,
		periodEnd: week.end,
		notes: '',
		rows: [] as BatchRow[]
	});

	const includedRows = $derived(batch.rows.filter((row) => row.include && !isBlank(row)));
	const periodError = $derived(
		!batch.periodStart !== !batch.periodEnd
			? 'Enter both period dates, or leave both empty'
			: batch.periodStart && batch.periodEnd && batch.periodStart > batch.periodEnd
				? 'The period cannot end before it starts'
				: ''
	);
	const batchReady = $derived(
		includedRows.length > 0 && includedRows.every(isValid) && !!batch.payDate && !periodError
	);

	function loadSet(setId: string) {
		batch.setId = setId;
		const set = data.sets.find((s) => String(s.setId) === setId);
		batch.rows = set ? set.items.map((item) => ({ ...item, include: true })) : [];
		if (!set) batch.rows.push({ employeeName: '', amount: null, include: true });
		duplicateWarning = null;
		batchMessage = null;
	}

	async function useSet(set: PayoutSet) {
		loadSet(String(set.setId));
		await tick();
		generateSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function addBatchRow() {
		batch.rows.push({ employeeName: '', amount: null, include: true });
	}

	function removeBatchRow(index: number) {
		batch.rows.splice(index, 1);
	}

	function saveBatchAsSet() {
		const rows = includedRows.map(({ employeeName, amount }) => ({ employeeName, amount }));
		openEditor({ setId: null, setName: '', rows });
	}

	// ---------- History ----------
	let historyMessage = $state<Message>(null);
	let expandedRunId = $state<number | null>(null);

	const periodText = (run: { periodStart: string | null; periodEnd: string | null }) =>
		run.periodStart && run.periodEnd
			? `${displayDate(run.periodStart)} – ${displayDate(run.periodEnd)}`
			: '—';
</script>

<div class="container mx-auto flex flex-col gap-6 p-4">
	<div class="flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Payroll</h1>
			<p class="text-sm text-gray-500 print:hidden">
				Save your regular employee payouts once, then generate each payroll in one batch. Every
				payout is added to Expenses automatically.
			</p>
		</div>
	</div>

	{#if data.loadError}
		<div class="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{data.loadError}</div>
	{/if}

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 print:hidden">
		<!-- Saved payout sets -->
		<section class="rounded-lg bg-white p-6 shadow-md">
			<div class="mb-4 flex items-center justify-between gap-2">
				<h2 class="text-xl font-semibold text-gray-800">Saved Payout Sets</h2>
				<button
					type="button"
					class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
					onclick={newSet}
				>
					+ New set
				</button>
			</div>

			{#if setMessage}
				<div
					class={`mb-4 rounded-md px-4 py-3 text-sm ${setMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
				>
					{setMessage.text}
				</div>
			{/if}

			{#if data.sets.length === 0 && !editor}
				<p class="text-sm text-gray-600">
					No saved payout sets yet. Create one with your staff and what each is paid, for example
					"Weekly Staff".
				</p>
			{/if}

			<ul class="flex flex-col gap-3">
				{#each data.sets as set (set.setId)}
					<li class="rounded-md border border-gray-200 p-4">
						<div class="flex flex-wrap items-start justify-between gap-2">
							<div>
								<p class="font-semibold text-gray-900">{set.setName}</p>
								<p class="text-sm text-gray-500">
									{set.items.length} employee{set.items.length === 1 ? '' : 's'} · {peso(set.total)}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<button
									type="button"
									class="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500"
									onclick={() => useSet(set)}
								>
									Use for payroll
								</button>
								<button
									type="button"
									class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
									onclick={() => editSet(set)}
								>
									Edit
								</button>
								<form
									method="POST"
									action="?/deleteSet"
									use:enhance={({ cancel }) => {
										if (
											!confirm(
												`Delete the payout set "${set.setName}"? Payrolls already generated from it are kept.`
											)
										) {
											cancel();
											return;
										}
										return async ({ result, update }) => {
											if (result.type === 'success' || result.type === 'failure') {
												setMessage = {
													type: result.type === 'success' ? 'success' : 'error',
													text: resultMessage(result, 'Payout set deleted')
												};
												if (result.type === 'success') {
													if (editor?.setId === set.setId) editor = null;
													if (batch.setId === String(set.setId)) batch.setId = '';
												}
											}
											await update({ reset: false });
										};
									}}
								>
									<input type="hidden" name="set_id" value={set.setId} />
									<button
										type="submit"
										class="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
									>
										Delete
									</button>
								</form>
							</div>
						</div>
						<ul class="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-700 sm:grid-cols-2">
							{#each set.items as item}
								<li class="flex justify-between gap-2">
									<span class="truncate">{item.employeeName}</span>
									<span class="whitespace-nowrap text-gray-900">{peso(item.amount)}</span>
								</li>
							{/each}
						</ul>
					</li>
				{/each}
			</ul>

			{#if editor}
				<div bind:this={editorSection} class="mt-6 scroll-mt-4 rounded-md bg-gray-50 p-4">
					<h3 class="mb-3 font-semibold text-gray-800">
						{editor.setId ? `Edit "${editor.setName || 'set'}"` : 'New payout set'}
					</h3>
					<form
						method="POST"
						action="?/saveSet"
						use:enhance={() => {
							return async ({ result, update }) => {
								if (result.type === 'success') {
									setMessage = {
										type: 'success',
										text: resultMessage(result, 'Payout set saved')
									};
									const savedId = String(result.data?.setId ?? '');
									editor = null;
									await update({ reset: false });
									// Keep the generator in sync if it was using this set
									if (savedId && batch.setId === savedId) loadSet(savedId);
									return;
								}
								if (result.type === 'failure') {
									setMessage = { type: 'error', text: resultMessage(result, 'Failed to save') };
									return;
								}
								await update({ reset: false });
							};
						}}
					>
						<input type="hidden" name="set_id" value={editor.setId ?? ''} />
						<input type="hidden" name="items" value={toPayload(editorRows)} />

						<label for="set_name" class="block text-sm font-semibold text-gray-700">Set name</label>
						<input
							id="set_name"
							name="set_name"
							type="text"
							required
							maxlength="255"
							placeholder="e.g. Weekly Staff"
							class="mt-1 mb-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							bind:value={editor.setName}
						/>

						<div class="mb-2 grid grid-cols-[1fr_9rem_2rem] gap-2 text-xs font-medium text-gray-500 uppercase">
							<span>Employee</span>
							<span class="text-right">Payout (₱)</span>
							<span></span>
						</div>
						{#each editor.rows as row, index}
							<div class="mb-2 grid grid-cols-[1fr_9rem_2rem] items-center gap-2">
								<input
									type="text"
									maxlength="255"
									placeholder="Employee name"
									aria-label="Employee name"
									class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									bind:value={row.employeeName}
								/>
								<input
									type="number"
									min="0.01"
									step="0.01"
									placeholder="0.00"
									aria-label="Payout amount"
									class="rounded-md border-gray-300 text-right shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									bind:value={row.amount}
								/>
								<button
									type="button"
									class="rounded text-lg leading-none text-gray-400 hover:text-red-600"
									aria-label="Remove employee"
									onclick={() => removeEditorRow(index)}
								>
									×
								</button>
							</div>
						{/each}

						<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
							<button
								type="button"
								class="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
								onclick={addEditorRow}
							>
								+ Add employee
							</button>
							<p class="text-sm text-gray-700">
								Total per payroll: <span class="font-semibold">{peso(totalOf(editorRows))}</span>
							</p>
						</div>

						<div class="mt-4 flex gap-2">
							<button
								type="submit"
								disabled={!editorReady}
								class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
							>
								Save set
							</button>
							<button
								type="button"
								class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50"
								onclick={() => (editor = null)}
							>
								Cancel
							</button>
						</div>
					</form>
				</div>
			{/if}
		</section>

		<!-- Generate payroll -->
		<section bind:this={generateSection} class="scroll-mt-4 rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Generate Payroll</h2>

			{#if batchMessage}
				<div
					class={`mb-4 rounded-md px-4 py-3 text-sm ${batchMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
				>
					{batchMessage.text}
				</div>
			{/if}

			<form
				method="POST"
				action="?/generate"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'success') {
							batchMessage = {
								type: 'success',
								text: resultMessage(result, 'Payroll generated')
							};
							duplicateWarning = null;
							batch.setId = '';
							batch.rows = [];
							batch.notes = '';
							const payMonth = Number(result.data?.payMonth);
							const payYear = Number(result.data?.payYear);
							// Show the new payroll in the history below
							if (payMonth && payYear && (payMonth !== data.currentMonth || payYear !== data.currentYear)) {
								await goto(`?month=${payMonth}&year=${payYear}`, { invalidateAll: true, noScroll: true });
							} else {
								await update({ reset: false });
							}
							return;
						}
						if (result.type === 'failure') {
							if (result.data?.duplicate) {
								duplicateWarning = String(result.data.error);
								batchMessage = null;
							} else {
								batchMessage = { type: 'error', text: resultMessage(result, 'Failed to generate') };
								duplicateWarning = null;
							}
							return;
						}
						await update({ reset: false });
					};
				}}
			>
				<input type="hidden" name="set_id" value={batch.setId} />
				<input type="hidden" name="items" value={toPayload(includedRows)} />

				<label for="batch_set" class="block text-sm font-semibold text-gray-700">Payout set</label>
				<select
					id="batch_set"
					class="mt-1 mb-4 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					value={batch.setId}
					onchange={(e) => loadSet((e.target as HTMLSelectElement).value)}
				>
					<option value="">Custom (no saved set)</option>
					{#each data.sets as set (set.setId)}
						<option value={String(set.setId)}>{set.setName} · {peso(set.total)}</option>
					{/each}
				</select>

				<div class="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div>
						<label for="pay_date" class="block text-sm font-semibold text-gray-700">Pay date</label>
						<input
							id="pay_date"
							name="pay_date"
							type="date"
							required
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							bind:value={batch.payDate}
						/>
					</div>
					<div>
						<label for="period_start" class="block text-sm font-semibold text-gray-700"
							>Period start</label
						>
						<input
							id="period_start"
							name="period_start"
							type="date"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							bind:value={batch.periodStart}
						/>
					</div>
					<div>
						<label for="period_end" class="block text-sm font-semibold text-gray-700"
							>Period end</label
						>
						<input
							id="period_end"
							name="period_end"
							type="date"
							class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							bind:value={batch.periodEnd}
						/>
					</div>
				</div>
				{#if periodError}
					<p class="-mt-2 mb-4 text-sm text-red-600">{periodError}</p>
				{/if}

				{#if batch.rows.length === 0}
					<p class="mb-4 rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
						Pick a payout set to load its employees, or
						<button
							type="button"
							class="font-semibold text-indigo-600 hover:text-indigo-800"
							onclick={addBatchRow}>add employees manually</button
						>.
					</p>
				{:else}
					<div class="mb-2 grid grid-cols-[1.5rem_1fr_9rem_2rem] gap-2 text-xs font-medium text-gray-500 uppercase">
						<span></span>
						<span>Employee</span>
						<span class="text-right">This payroll (₱)</span>
						<span></span>
					</div>
					{#each batch.rows as row, index}
						<div
							class={`mb-2 grid grid-cols-[1.5rem_1fr_9rem_2rem] items-center gap-2 ${row.include ? '' : 'opacity-50'}`}
						>
							<input
								type="checkbox"
								aria-label="Include in this payroll"
								class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
								bind:checked={row.include}
							/>
							<input
								type="text"
								maxlength="255"
								placeholder="Employee name"
								aria-label="Employee name"
								class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								bind:value={row.employeeName}
							/>
							<input
								type="number"
								min="0.01"
								step="0.01"
								placeholder="0.00"
								aria-label="Payout amount"
								class="rounded-md border-gray-300 text-right shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								bind:value={row.amount}
							/>
							<button
								type="button"
								class="rounded text-lg leading-none text-gray-400 hover:text-red-600"
								aria-label="Remove employee"
								onclick={() => removeBatchRow(index)}
							>
								×
							</button>
						</div>
					{/each}
					<div class="mt-3 flex flex-wrap items-center justify-between gap-2">
						<div class="flex gap-4">
							<button
								type="button"
								class="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
								onclick={addBatchRow}
							>
								+ Add employee
							</button>
							{#if !batch.setId && includedRows.length > 0}
								<button
									type="button"
									class="text-sm font-semibold text-gray-600 hover:text-gray-800"
									onclick={saveBatchAsSet}
								>
									Save as a set
								</button>
							{/if}
						</div>
						<p class="text-sm text-gray-700">
							{includedRows.length} payout{includedRows.length === 1 ? '' : 's'} ·
							<span class="font-semibold">{peso(totalOf(includedRows))}</span>
						</p>
					</div>
					{#if batch.setId}
						<p class="mt-2 text-xs text-gray-500">
							Changes here apply to this payroll only. Edit the set to change its saved amounts.
						</p>
					{/if}
				{/if}

				<label for="notes" class="mt-4 block text-sm font-semibold text-gray-700"
					>Notes (optional)</label
				>
				<input
					id="notes"
					name="notes"
					type="text"
					maxlength="1000"
					placeholder="e.g. includes holiday pay"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					bind:value={batch.notes}
				/>

				{#if duplicateWarning}
					<div class="mt-4 rounded-md bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
						<p>{duplicateWarning} Generate it again anyway?</p>
						<div class="mt-2 flex gap-2">
							<button
								type="submit"
								name="allow_duplicate"
								value="true"
								disabled={!batchReady}
								class="rounded-md bg-yellow-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
							>
								Generate anyway
							</button>
							<button
								type="button"
								class="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
								onclick={() => (duplicateWarning = null)}
							>
								Cancel
							</button>
						</div>
					</div>
				{:else}
					<button
						type="submit"
						disabled={!batchReady}
						class="mt-6 w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Generate payroll{includedRows.length > 0 ? ` · ${peso(totalOf(includedRows))}` : ''}
					</button>
				{/if}
			</form>
		</section>
	</div>

	<!-- Payroll history -->
	<section class="rounded-lg bg-white p-6 shadow-md print:shadow-none">
		<div class="mb-4 flex flex-wrap items-center justify-between gap-4">
			<h2 class="text-xl font-semibold text-gray-800">
				Payroll History · {months[data.currentMonth - 1]}
				{data.currentYear}
			</h2>
			<form method="POST" action="?/changeMonth" class="flex items-center gap-2 print:hidden">
				<MonthYearPicker bind:selectedMonth bind:selectedYear />
				<button
					type="submit"
					class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
				>
					Update
				</button>
			</form>
		</div>

		{#if historyMessage}
			<div
				class={`mb-4 rounded-md px-4 py-3 text-sm print:hidden ${historyMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
			>
				{historyMessage.text}
			</div>
		{/if}

		{#if data.runs.length === 0}
			<p class="text-sm text-gray-600">No payroll generated for this month.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Pay date</th>
							<th class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Payout set</th>
							<th class="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Period</th>
							<th class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Employees</th>
							<th class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">Total</th>
							<th class="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase print:hidden">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each data.runs as run (run.runId)}
							<tr>
								<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-900">{displayDate(run.payDate)}</td>
								<td class="px-4 py-3 text-sm text-gray-900">
									{run.setName ?? 'Custom'}
									{#if run.notes}
										<span class="block text-xs text-gray-500">{run.notes}</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-sm whitespace-nowrap text-gray-700">{periodText(run)}</td>
								<td class="px-4 py-3 text-right text-sm text-gray-700">{run.items.length}</td>
								<td class="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap text-gray-900">{peso(run.total)}</td>
								<td class="px-4 py-3 text-right text-sm whitespace-nowrap print:hidden">
									<div class="flex justify-end gap-2">
										<button
											type="button"
											class="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200"
											onclick={() =>
												(expandedRunId = expandedRunId === run.runId ? null : run.runId)}
										>
											{expandedRunId === run.runId ? 'Hide' : 'View'}
										</button>
										<form
											method="POST"
											action="?/deleteRun"
											use:enhance={({ cancel }) => {
												if (
													!confirm(
														`Delete this payroll (${peso(run.total)})? Its ${run.items.length} expense${run.items.length === 1 ? '' : 's'} will also be removed.`
													)
												) {
													cancel();
													return;
												}
												return async ({ result, update }) => {
													if (result.type === 'success' || result.type === 'failure') {
														historyMessage = {
															type: result.type === 'success' ? 'success' : 'error',
															text: resultMessage(result, 'Payroll deleted')
														};
													}
													await update({ reset: false });
												};
											}}
										>
											<input type="hidden" name="run_id" value={run.runId} />
											<button
												type="submit"
												class="rounded-md bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100"
											>
												Delete
											</button>
										</form>
									</div>
								</td>
							</tr>
							<!-- Payout details: toggled on screen, always shown when printing -->
							<tr class={expandedRunId === run.runId ? '' : 'hidden print:table-row'}>
								<td colspan="6" class="bg-gray-50 px-4 py-3">
									<table class="w-full max-w-xl text-sm">
										<tbody>
											{#each run.items as item}
												<tr>
													<td class="py-1 pr-4 text-gray-700">
														{item.employeeName}
														{#if !item.hasExpense}
															<span
																class="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 print:hidden"
																title="This payout's expense was deleted from the Expenses page"
															>
																expense removed
															</span>
														{/if}
													</td>
													<td class="py-1 text-right whitespace-nowrap text-gray-900">{peso(item.amount)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</td>
							</tr>
						{/each}
						<tr class="bg-gray-50">
							<td colspan="4" class="px-4 py-3 text-sm font-semibold text-gray-900">Month total</td>
							<td class="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap text-gray-900">{peso(data.monthTotal)}</td>
							<td class="print:hidden"></td>
						</tr>
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</div>
