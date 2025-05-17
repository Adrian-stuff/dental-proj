<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	};

	// Handle clinic selection
	function filterByClinic(event: Event) {
		const select = event.target as HTMLSelectElement;
		const value = select.value;
		goto(`?clinic=${value}`, { replaceState: true });
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-2xl font-bold">Data Summary</h1>

	<div class="mb-6">
		<label for="clinic" class="font-medium">Filter by Clinic:</label>
		<select id="clinic" class="ml-2 rounded border p-2" onchange={filterByClinic}>
			<option value="all">All Clinics</option>
			{#each data.clinics as clinic}
				<option value={clinic.id} selected={clinic.id === Number(data.selectedClinic)}
					>{clinic.name}</option
				>
			{/each}
		</select>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-2 text-xl font-semibold">Total Cases</h2>
			<p class="text-3xl">{data.summary.totalCases}</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-2 text-xl font-semibold">Total Amount</h2>
			<p class="text-3xl">{formatCurrency(data.summary.totalAmount)}</p>
		</div>
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-2 text-xl font-semibold">Paid Amount</h2>
			<p class="text-3xl">{formatCurrency(data.summary.paidAmount)}</p>
		</div>
	</div>

	<div class="rounded-lg bg-white p-6 shadow">
		<h2 class="mb-4 text-xl font-semibold">Case Types Distribution</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each Object.entries(data.summary.caseTypes) as [type, count]}
				<div class="rounded border p-4">
					<h3 class="font-medium">{type}</h3>
					<p class="text-2xl">{count}</p>
				</div>
			{/each}
		</div>
	</div>
</div>
