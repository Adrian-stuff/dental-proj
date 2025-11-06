<script lang="ts">
	export let data: any;
	const balances: any[] = data?.balances || [];

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		// Format using Philippine Peso (PHP) and en-PH locale to show ₱
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<h1 class="mb-6 text-2xl font-bold">Clinic Balances</h1>

	<div class="overflow-x-auto">
		<table class="min-w-full border-collapse rounded-lg border border-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Clinic</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Total Orders</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Total Paid</th
					>
					<th
						class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Balance</th
					>
					<th
						class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
						>Actions</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if balances.length === 0}
					<tr>
						<td class="px-6 py-6 text-sm text-gray-700" colspan="5">No data available.</td>
					</tr>
				{/if}
				{#each balances as b}
					<tr class="border-b border-gray-200">
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
		</table>
	</div>
</div>
