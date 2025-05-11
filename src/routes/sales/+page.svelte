<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData, supplies } = data;

	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);

	interface ClientIncome {
		name: string;
		income: number;
	}

	interface StaffSalary {
		name: string;
		salary: number;
	}

	function calculateClientIncome(records: any[]): ClientIncome[] {
		const clientIncomes: { [key: string]: number } = {};
		records.forEach((record) => {
			if (record.clinicName && record.paidAmount) {
				const paidAmount = parseFloat(record.paidAmount);
				clientIncomes[record.clinicName] = (clientIncomes[record.clinicName] || 0) + paidAmount;
			}
		});
		return Object.entries(clientIncomes).map(([clinicName, income]) => ({
			name: clinicName,
			income
		}));
	}

	function calculateTotalIncome(records: any[]): number {
		let total = 0;
		records.forEach((record) => {
			if (record.paidAmount) {
				total += parseFloat(record.paidAmount);
			}
		});
		return total;
	}

	function calculateTotalSupply(supplies: any[]): number {
		return supplies.reduce((total, supply) => {
			return total + (parseFloat(supply.supplyCost) || 0);
		}, 0);
	}

	const clients: ClientIncome[] = calculateClientIncome(recordData);
	const totalIncome: number = calculateTotalIncome(recordData);

	// Calculate total supply from supplies array
	const totalSupply: number = calculateTotalSupply(supplies);
	const staffSalaries: StaffSalary[] = [];
	const totalSalaries: number = 0;
	const totalExpenses: number = totalSupply + totalSalaries;
	const totalProfit: number = totalIncome - totalExpenses;

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}
</script>

<div class="container mx-auto flex flex-col items-center justify-center p-4">
	<div class="mb-6 flex w-full items-center justify-between">
		<h1 class="text-2xl font-bold">Financial Summary</h1>

		<!-- Month Year Picker Form -->
		<form method="POST" action="?/changeDate" class="flex items-center gap-4">
			<MonthYearPicker bind:selectedMonth bind:selectedYear />
			<button
				type="submit"
				class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
			>
				Update
			</button>
		</form>
	</div>

	<!-- Display selected month and year -->
	<div class="mb-4 w-full text-sm text-gray-500">
		Showing data for: {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})}
	</div>

	<div class="flex flex-row gap-6">
		<div class="flex-1 rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold">Income</h2>
			<div class="overflow-x-auto">
				<table class="min-w-full border-collapse rounded-lg border border-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Name of Clients (Clinic)
							</th>
							<th
								class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
							>
								Income (Paid Amount)
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each clients as client}
							<tr>
								<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{client.name}</td>
								<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
									{client.income.toFixed(2)}
								</td>
							</tr>
						{/each}
						<tr>
							<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
								Total Income
							</td>
							<td
								class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
							>
								{totalIncome.toFixed(2)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<div class="flex-1 rounded-lg bg-white p-6 shadow-md">
			<h2 class="mb-4 text-xl font-semibold">Expenses</h2>
			<div class="flex flex-col gap-4">
				<div>
					<h3 class="text-lg font-semibold">Supply</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full border-collapse rounded-lg border border-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Date
									</th>
									<th
										class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Amount
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#each supplies as supply}
									<tr>
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
											{formatDate(supply.supplyDate)}
										</td>
										<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
											{parseFloat(supply.supplyCost).toFixed(2)}
										</td>
									</tr>
								{/each}
								<tr>
									<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
										Total Supply
									</td>
									<td
										class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
									>
										{totalSupply.toFixed(2)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div>
					<h3 class="text-lg font-semibold">Staff Salary</h3>
					<div class="overflow-x-auto">
						<table class="min-w-full border-collapse rounded-lg border border-gray-200">
							<thead class="bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Staff
									</th>
									<th
										class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Salary
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#each staffSalaries as staff}
									<tr>
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{staff.name}</td>
										<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
											{staff.salary.toFixed(2)}
										</td>
									</tr>
								{/each}
								<tr>
									<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
										Total Salary
									</td>
									<td
										class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
									>
										{totalSalaries.toFixed(2)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="mt-4">
				<p class="text-sm font-semibold">
					Total Expenses: <span class="font-normal text-gray-900">{totalExpenses.toFixed(2)}</span>
				</p>
			</div>
		</div>
	</div>

	<div class="mt-8 rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-2 text-xl font-semibold">Profit</h2>
		<p class="text-xl font-bold text-green-500">Total Profit: {totalProfit.toFixed(2)}</p>
	</div>
</div>
