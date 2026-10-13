<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	// Running amount owed by the clinic: charges add to it, payments reduce it
	const rows = $derived.by(() => {
		let running = data.openingBalance;
		return data.entries.map((entry) => {
			running += entry.type === 'charge' ? entry.amount : -entry.amount;
			return { ...entry, balance: running };
		});
	});

	const totals = $derived.by(() => {
		const charges = data.entries
			.filter((e) => e.type === 'charge')
			.reduce((sum, e) => sum + e.amount, 0);
		const payments = data.entries
			.filter((e) => e.type === 'payment')
			.reduce((sum, e) => sum + e.amount, 0);
		return { charges, payments, due: data.openingBalance + charges - payments };
	});

	const period = $derived(
		data.from || data.to ? `${data.from || 'Start'} to ${data.to || 'Today'}` : 'All dates'
	);
</script>

<svelte:head>
	<title>SOA - {data.clinic.clinicName} | Cassey Dental Records System</title>
</svelte:head>

<div class="container mx-auto rounded-md bg-white p-6 shadow-md">
	<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-sm font-medium tracking-wider text-gray-500 uppercase">Statement of Account</p>
			<h1 class="text-3xl font-bold text-gray-800">{data.clinic.clinicName}</h1>
			<p class="text-sm text-gray-500">{period} · finished cases only</p>
		</div>

		<form method="GET" class="flex flex-wrap items-end gap-2 print:hidden">
			<div>
				<label for="from" class="block text-sm font-semibold text-gray-700">From:</label>
				<input
					type="date"
					id="from"
					name="from"
					value={data.from}
					class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="to" class="block text-sm font-semibold text-gray-700">To:</label>
				<input
					type="date"
					id="to"
					name="to"
					value={data.to}
					class="mt-1 block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<button
				type="submit"
				class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
			>
				Update
			</button>
			<a
				href={`/soa/${data.clinic.clinicId}`}
				class="rounded-md px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
			>
				All dates
			</a>
		</form>
	</div>

	<div class="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Previous Balance</p>
			<p class="text-xl font-semibold text-gray-800">{fmt(data.openingBalance)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Charges</p>
			<p class="text-xl font-semibold text-gray-800">{fmt(totals.charges)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">Payments</p>
			<p class="text-xl font-semibold text-green-600">{fmt(totals.payments)}</p>
		</div>
		<div class="rounded-md border border-gray-200 p-4">
			<p class="text-xs font-medium tracking-wider text-gray-500 uppercase">
				{totals.due < 0 ? 'Credit' : 'Balance Due'}
			</p>
			<p class="text-xl font-semibold {totals.due > 0 ? 'text-red-600' : 'text-green-600'}">
				{fmt(Math.abs(totals.due))}
			</p>
		</div>
	</div>

	{#if rows.length > 0}
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
							Charge
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Payment
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Balance Due
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each rows as row (row.key)}
						<tr>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">{row.date}</td>
							<td class="px-6 py-4 text-sm text-gray-800">
								<a href={`/details/${row.recordId}`} class="hover:underline">
									{row.type === 'charge' ? 'Case' : 'Payment'} - {row.patientName}
								</a>
								<div class="text-xs text-gray-500">
									{[row.doctorName, row.paymentMethod].filter(Boolean).join(' · ')}
								</div>
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-800">
								{row.type === 'charge' ? fmt(row.amount) : ''}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-green-600">
								{row.type === 'payment' ? fmt(row.amount) : ''}
							</td>
							<td
								class="px-6 py-4 text-right text-sm whitespace-nowrap {row.balance > 0
									? 'text-red-600'
									: 'text-gray-800'}"
							>
								{fmt(row.balance)}
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot class="bg-gray-50">
					<tr class="font-semibold">
						<td class="px-6 py-3 text-sm text-gray-800" colspan="2">Total</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-gray-800">
							{fmt(totals.charges)}
						</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-green-600">
							{fmt(totals.payments)}
						</td>
						<td class="px-6 py-3 text-right text-sm whitespace-nowrap text-gray-800">
							{fmt(totals.due)}
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
	{:else}
		<p class="text-gray-600">No finished cases or payments for this period.</p>
	{/if}
</div>
