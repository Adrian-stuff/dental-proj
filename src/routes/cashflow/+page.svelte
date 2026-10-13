<script lang="ts">
	import type { PageProps } from './$types';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';

	let { data }: PageProps = $props();

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

	let selectedMonth = $state(data.currentMonth);
	let selectedYear = $state(data.currentYear);

	type TypeFilter = 'all' | 'in' | 'out';
	let typeFilter = $state<TypeFilter>('all');

	type Entry = {
		key: string;
		date: string;
		type: 'in' | 'out';
		description: string;
		detail: string;
		recordId: number | null;
		amount: number;
		balance: number;
	};

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	// Payments and expenses merged into one statement, oldest first, with a running balance
	const entries = $derived.by(() => {
		const merged: Entry[] = [
			...data.moneyIn.map((p) => ({
				key: `in-${p.paymentId}`,
				date: p.paymentDate,
				type: 'in' as const,
				description: [p.clinicName, p.patientName].filter(Boolean).join(' - ') || 'Payment',
				detail: [p.doctorName, p.paymentMethod].filter(Boolean).join(' · '),
				recordId: p.recordId,
				amount: Number(p.amount) || 0,
				balance: 0
			})),
			...data.moneyOut.map((s) => ({
				key: `out-${s.supplyId}`,
				date: s.supplyDate,
				type: 'out' as const,
				description: s.supplyDescription || 'Expense',
				detail: '',
				recordId: null,
				amount: Number(s.supplyCost) || 0,
				balance: 0
			}))
		].sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));

		let running = data.openingBalance;
		for (const entry of merged) {
			running += entry.type === 'in' ? entry.amount : -entry.amount;
			entry.balance = running;
		}
		return merged;
	});

	const visibleEntries = $derived(
		typeFilter === 'all' ? entries : entries.filter((e) => e.type === typeFilter)
	);

	const totals = $derived.by(() => {
		const totalIn = entries.filter((e) => e.type === 'in').reduce((sum, e) => sum + e.amount, 0);
		const totalOut = entries.filter((e) => e.type === 'out').reduce((sum, e) => sum + e.amount, 0);
		return {
			totalIn,
			totalOut,
			net: totalIn - totalOut,
			closing: data.openingBalance + totalIn - totalOut
		};
	});
</script>

<div class="container mx-auto rounded-md bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Money History</h1>
			<p class="text-sm text-gray-500">
				Statement of money in and out for {months[data.currentMonth - 1]}
				{data.currentYear}
			</p>
		</div>

		<form method="GET" class="flex flex-wrap items-center gap-2 print:hidden">
			<MonthYearPicker bind:selectedMonth bind:selectedYear />
			<button
				type="submit"
				class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
			>
				Update
			</button>
		</form>
	</div>

	{#if data.error}
		<div class="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{data.error}
		</div>
	{/if}

	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Opening Balance</p>
			<p class="text-xl font-semibold text-gray-800">{fmt(data.openingBalance)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Money In</p>
			<p class="text-xl font-semibold text-green-600">{fmt(totals.totalIn)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Money Out</p>
			<p class="text-xl font-semibold text-red-600">{fmt(totals.totalOut)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Closing Balance</p>
			<p class="text-xl font-semibold {totals.closing < 0 ? 'text-red-600' : 'text-gray-800'}">
				{fmt(totals.closing)}
			</p>
			<p class="text-xs text-gray-500">Net this month: {fmt(totals.net)}</p>
		</div>
	</div>

	<div class="mb-4 flex gap-2 print:hidden">
		{#each [['all', 'All'], ['in', 'Money In'], ['out', 'Money Out']] as [value, label]}
			<button
				type="button"
				onclick={() => (typeFilter = value as TypeFilter)}
				class="rounded-md px-3 py-2 text-sm font-semibold {typeFilter === value
					? 'bg-indigo-600 text-white'
					: 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'}"
			>
				{label}
			</button>
		{/each}
	</div>

	{#if visibleEntries.length > 0}
		<div class="overflow-x-auto rounded-md shadow-sm">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Date
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Description
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							In
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Out
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Balance
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each visibleEntries as entry (entry.key)}
						<tr>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{entry.date}
							</td>
							<td class="px-6 py-4 text-sm text-gray-800">
								{#if entry.recordId}
									<a href={`/details/${entry.recordId}`} class="hover:underline">
										{entry.description}
									</a>
								{:else}
									{entry.description}
								{/if}
								{#if entry.detail}
									<div class="text-xs text-gray-500">{entry.detail}</div>
								{/if}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-green-600">
								{entry.type === 'in' ? fmt(entry.amount) : ''}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-red-600">
								{entry.type === 'out' ? fmt(entry.amount) : ''}
							</td>
							<td
								class="px-6 py-4 text-right text-sm whitespace-nowrap {entry.balance < 0
									? 'text-red-600'
									: 'text-gray-800'}"
							>
								{fmt(entry.balance)}
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot class="bg-gray-50">
					<tr class="font-semibold">
						<td class="px-6 py-3 text-sm text-gray-800" colspan="2">Total</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-green-600">
							{typeFilter === 'out' ? '' : fmt(totals.totalIn)}
						</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-red-600">
							{typeFilter === 'in' ? '' : fmt(totals.totalOut)}
						</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-gray-800">
							{fmt(totals.closing)}
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{:else}
		<p class="text-gray-600">No money in or out recorded for this month.</p>
	{/if}
</div>
