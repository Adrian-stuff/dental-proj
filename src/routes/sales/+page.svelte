<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData, supplies } = data;
	console.log(data.recordData);
	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);
	let selectedDate = $state<string | null>(null); // Add this for exact date
	let isExactDate = $state(false); // Add this to toggle between month/year and exact date

	// Add this function to handle date changes
	function handleDateToggle() {
		isExactDate = !isExactDate;
		if (!isExactDate) {
			selectedDate = null;
		}
	}

	interface ClientIncome {
		name: string;
		income: number;
	}

	function calculateClientIncome(records: any[]): ClientIncome[] {
		const clientIncomes: { [key: string]: number } = {};
		records.forEach((record) => {
			const clinic = record.clinicName;
			const paid = parseFloat(record.order?.paidAmount || 0);
			if (clinic && paid) {
				clientIncomes[clinic] = (clientIncomes[clinic] || 0) + paid;
			}
		});
		return Object.entries(clientIncomes).map(([name, income]) => ({
			name,
			income
		}));
	}

	function calculateTotalIncome(records: any[]): number {
		return records.reduce((total, record) => {
			return total + parseFloat(record.order?.paidAmount || 0);
		}, 0);
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
	let staffSalaries = $state([]);
	let newStaffName = $state('');
	let newStaffSalary = $state('');
	let totalSalaries = $state(0);
	let totalExpenses = $state(0);
	let totalProfit = $state(0);

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}

	function addSalary() {
		if (newStaffName && newStaffSalary) {
			staffSalaries = [
				...staffSalaries,
				{
					name: newStaffName,
					salary: parseFloat(newStaffSalary)
				}
			];
			newStaffName = '';
			newStaffSalary = '';
		}
	}

	function removeSalary(index: number) {
		staffSalaries = staffSalaries.filter((_, i) => i !== index);
	}

	// Update total calculations
	$effect(() => {
		totalSalaries = staffSalaries.reduce((total, staff) => total + staff.salary, 0);
		totalExpenses = totalSupply + totalSalaries;
		totalProfit = totalIncome - totalExpenses;
	});
</script>

<div class="container mx-auto flex flex-col items-center justify-center p-4">
	<div class="mb-6 flex w-full items-center justify-between">
		<h1 class="text-2xl font-bold">Financial Summary</h1>

		<!-- Month Year Picker Form -->
		<form method="POST" action="?/changeDate" class="flex items-center gap-4 print:hidden">
			<div class="flex items-center gap-4">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={isExactDate}
						onchange={handleDateToggle}
						class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
					/>
					<span class="text-sm text-gray-700">Exact Date</span>
				</label>

				{#if isExactDate}
					<input
						type="date"
						name="exact_date"
						bind:value={selectedDate}
						class="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
				{:else}
					<MonthYearPicker bind:selectedMonth bind:selectedYear />
				{/if}
			</div>

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
		Showing data for:
		{#if isExactDate && selectedDate}
			{new Date(selectedDate).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		{:else}
			{new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
				month: 'long',
				year: 'numeric'
			})}
		{/if}
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
									&#8369;{client.income.toFixed(2)}
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
								&#8369;{totalIncome.toFixed(2)}
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
										class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Description
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
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
											{supply.supplyDescription || '-'}
										</td>
										<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
											&#8369;{parseFloat(supply.supplyCost).toFixed(2)}
										</td>
									</tr>
								{/each}
								<tr>
									<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
										Total Supply
									</td>
									<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900"> </td>
									<td
										class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
									>
										&#8369;{totalSupply.toFixed(2)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<div>
					<h3 class="mb-4 text-lg font-semibold">Add Staff Salary</h3>
					<div class="mb-4 flex gap-4">
						<div class="flex-1">
							<label for="staffName" class="mb-1 block text-sm font-medium text-gray-700">
								Staff Name
							</label>
							<input
								type="text"
								id="staffName"
								bind:value={newStaffName}
								class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="Enter staff name"
							/>
						</div>
						<div class="flex-1">
							<label for="staffSalary" class="mb-1 block text-sm font-medium text-gray-700">
								Salary Amount
							</label>
							<input
								type="number"
								id="staffSalary"
								bind:value={newStaffSalary}
								class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="Enter salary amount"
								min="0"
								step="0.01"
							/>
						</div>
						<div class="flex items-end">
							<button
								type="button"
								onclick={addSalary}
								class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
							>
								Add Salary
							</button>
						</div>
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
									<th
										class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
									>
										Actions
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200 bg-white">
								{#if staffSalaries.length === 0}
									<tr>
										<td colspan="3" class="px-6 py-4 text-center text-sm text-gray-500">
											No staff salaries added
										</td>
									</tr>
								{/if}
								{#each staffSalaries as staff, index}
									<tr>
										<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
											{staff.name}
										</td>
										<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
											&#8369;{staff.salary.toFixed(2)}
										</td>
										<td class="px-6 py-4 text-right">
											<button
												type="button"
												onclick={() => removeSalary(index)}
												class="text-red-600 hover:text-red-800"
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													class="h-5 w-5"
													viewBox="0 0 20 20"
													fill="currentColor"
												>
													<path
														fill-rule="evenodd"
														d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
														clip-rule="evenodd"
													/>
												</svg>
											</button>
										</td>
									</tr>
								{/each}
								<tr>
									<td class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900">
										Total Salary
									</td>
									<td
										colspan="2"
										class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
									>
										&#8369;{totalSalaries.toFixed(2)}
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
			<div class="mt-4">
				<p class="text-sm font-semibold">
					Total Expenses: <span class="font-normal text-gray-900"
						>&#8369;{totalExpenses.toFixed(2)}</span
					>
				</p>
			</div>
		</div>
	</div>

	<div class="mt-8 rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-2 text-xl font-semibold">Profit</h2>
		<p class={`text-xl font-bold ${totalProfit > 0 ? 'text-green-500' : 'text-red-400'}`}>
			Total Profit: &#8369;{totalProfit.toFixed(2)}
		</p>
	</div>
</div>
