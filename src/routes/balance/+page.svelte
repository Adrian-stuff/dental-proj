<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
	const balances: any[] = data?.balances || [];

	type SortColumn = 'clinicName' | 'totalOrders' | 'totalPaid' | 'balance';
	type SortDirection = 'asc' | 'desc';

	let sortColumn = $state<SortColumn | null>(null);
	let sortDirection = $state<SortDirection>('asc');

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		// Format using Philippine Peso (PHP) and en-PH locale to show ₱
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	function handleSort(column: SortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	const sortedBalances = $derived.by(() => {
		if (!sortColumn) return balances;

		const sorted = [...balances].sort((a, b) => {
			let aVal: any;
			let bVal: any;

			switch (sortColumn) {
				case 'clinicName':
					aVal = (a.clinicName ?? '').toLowerCase();
					bVal = (b.clinicName ?? '').toLowerCase();
					break;
				case 'totalOrders':
					aVal = Number(a.totalOrders ?? 0);
					bVal = Number(b.totalOrders ?? 0);
					break;
				case 'totalPaid':
					aVal = Number(a.totalPaid ?? 0);
					bVal = Number(b.totalPaid ?? 0);
					break;
				case 'balance':
					aVal = Number(a.totalPaid ?? 0) - Number(a.totalOrders ?? 0);
					bVal = Number(b.totalPaid ?? 0) - Number(b.totalOrders ?? 0);
					break;
				default:
					return 0;
			}

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		return sorted;
	});

	function isSorted(column: SortColumn): boolean {
		return sortColumn === column;
	}

	function getRowClass(balance: any): string {
		const balanceValue = Number(balance.totalPaid ?? 0) - Number(balance.totalOrders ?? 0);
		if (balanceValue > 0) {
			return 'bg-green-300 ';
		} else if (balanceValue < 0) {
			return 'bg-red-300 ';
		} else {
			return 'bg-gray-300 ';
		}
	}

	const summaryTotals = $derived.by(() => {
		const totals = sortedBalances.reduce(
			(acc, b) => {
				acc.totalOrders += Number(b.totalOrders ?? 0);
				acc.totalPaid += Number(b.totalPaid ?? 0);
				return acc;
			},
			{ totalOrders: 0, totalPaid: 0 }
		);
		totals.balance = totals.totalPaid - totals.totalOrders;
		return totals;
	});
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-bold">Clinic Balances</h1>

	<div class="overflow-x-auto">
		<table class="min-w-full border-collapse rounded-lg border border-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('clinicName')}
					>
						<div class="flex items-center">
							Clinic
							{#if !isSorted('clinicName')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('totalOrders')}
					>
						<div class="flex items-center justify-end">
							Total Orders
							{#if !isSorted('totalOrders')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('totalPaid')}
					>
						<div class="flex items-center justify-end">
							Total Paid
							{#if !isSorted('totalPaid')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('balance')}
					>
						<div class="flex items-center justify-end">
							Balance
							{#if !isSorted('balance')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedBalances.length === 0}
					<tr>
						<td class="px-6 py-6 text-sm text-gray-700" colspan="5">No data available.</td>
					</tr>
				{/if}
				{#each sortedBalances as b}
					<tr class={`border-b border-gray-200 transition-colors ${getRowClass(b)}`}>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{b.clinicName ?? '—'}</td>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.totalOrders)}</td
						>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.totalPaid)}</td
						>
						<td
							class={`px-6 py-4 text-right text-sm whitespace-nowrap ${Number(b.totalPaid) - Number(b.totalOrders) > 0 ? 'text-green-600' : 'text-red-600'}`}
						>
							{#if Number(b.totalPaid) - Number(b.totalOrders) < 0}
								-{fmt(Math.abs(Number(b.totalPaid) - Number(b.totalOrders)))}
							{:else}
								+{fmt(Math.abs(Number(b.totalPaid) - Number(b.totalOrders)))}
							{/if}
						</td>
						<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
							<a
								href={`/?clinic_id=${b.clinicId}`}
								class="inline-block rounded bg-indigo-600 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-500"
								>Details</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t-2 border-gray-400 bg-gray-200 font-semibold">
					<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">TOTAL</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.totalOrders)}
					</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.totalPaid)}
					</td>
					<td
						class={`px-6 py-4 text-right text-sm whitespace-nowrap ${
							summaryTotals.balance > 0
								? 'text-green-700'
								: summaryTotals.balance < 0
									? 'text-red-700'
									: 'text-gray-700'
						}`}
					>
						{#if summaryTotals.balance < 0}
							-{fmt(Math.abs(summaryTotals.balance))}
						{:else}
							+{fmt(Math.abs(summaryTotals.balance))}
						{/if}
					</td>
					<td class="px-6 py-4 text-center text-sm whitespace-nowrap"></td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
