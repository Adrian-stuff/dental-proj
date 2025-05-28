<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData, supplies } = data;
	console.log(data.recordData);
	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);

	interface ClientTransaction {
		name: string;
		transactions: Array<{
			dateDropoff: string;
			patientName: string;
			paidAmount: number;
			orderTotal: number;
			paymentMethod: string;
			paymentStatus: string;
		}>;
		totalIncome: number;
	}

	function calculateClientIncome(records: any[]): ClientTransaction[] {
		const clientData: { [key: string]: { transactions: any[]; totalIncome: number } } = {};

		records.forEach((record) => {
			const clinic = record.clinicName;
			const paid = parseFloat(record.order?.paidAmount || 0);
			const dropoff = record.record?.dateDropoff;

			// Only process records that have a dropoff date
			if (clinic && dropoff) {
				if (!clientData[clinic]) {
					clientData[clinic] = { transactions: [], totalIncome: 0 };
				}

				clientData[clinic].transactions.push({
					dateDropoff: dropoff,
					patientName: record.record.patientName,
					paidAmount: paid,
					orderTotal: parseFloat(record.order?.orderTotal || 0),
					paymentMethod: record.order?.paymentMethod,
					paymentStatus: record.order?.paymentStatus
				});

				clientData[clinic].totalIncome += paid;
			}
		});

		return Object.entries(clientData).map(([name, data]) => ({
			name,
			transactions: data.transactions,
			totalIncome: data.totalIncome
		}));
	}

	// Also update the total income calculation
	function calculateTotalIncome(records: any[]): number {
		return records.reduce((total, record) => {
			// Only include in total if there's a dropoff date
			if (record.record?.dateDropoff) {
				return total + parseFloat(record.order?.paidAmount || 0);
			}
			return total;
		}, 0);
	}

	function calculateTotalSupply(supplies: any[]): number {
		return supplies.reduce((total, supply) => {
			return total + (parseFloat(supply.supplyCost) || 0);
		}, 0);
	}

	const clients: ClientTransaction[] = calculateClientIncome(recordData);
	const totalIncome: number = calculateTotalIncome(recordData);

	// Calculate total supply from supplies array
	const totalSupply: number = calculateTotalSupply(supplies);
	let staffSalaries = $state([]);
	let newStaffName = $state('');
	let newStaffSalary = $state('');

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

	// First, initialize state variables
	let weeklyData = $state<WeeklyTransactions[]>([]);
	let totalSalaries = $state(0);
	let totalExpenses = $state(0);
	let totalWeeklyExpenses = $state(0);
	let totalProfit = $state(0);

	// Combined effect to handle all calculations in correct order
	$effect(() => {
		// Store intermediate values to avoid circular dependencies
		const calculatedTotalSalaries = staffSalaries.reduce((total, staff) => total + staff.salary, 0);
		const calculatedWeeklyData = groupTransactionsByWeek(recordData, supplies, staffSalaries);
		const calculatedWeeklyExpenses = calculatedWeeklyData.reduce(
			(total, week) => total + week.totalExpenses,
			0
		);

		// Update all state once, in the correct order
		weeklyData = calculatedWeeklyData;
		totalSalaries = calculatedTotalSalaries;
		totalWeeklyExpenses = calculatedWeeklyExpenses;

		// Finally calculate the derived totals
		totalExpenses = totalSupply + calculatedTotalSalaries + calculatedWeeklyExpenses;
		totalProfit = totalIncome - totalExpenses;
	});

	// Add this near the top of your script section
	interface WeeklySalaryInput {
		staffName: string;
		amount: number;
	}

	let salaryInputs = $state(new Map<string, WeeklySalaryInput>());

	// Add these helper functions after the interface definition
	function getWeekRange(date: Date): string {
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

		return `${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())}`;
	}

	interface WeeklyTransactions {
		weekRange: string;
		transactions: Array<{
			clinic: string;
			dateDropoff: string;
			patientName: string;
			paidAmount: number;
			orderTotal: number;
			paymentMethod: string;
			paymentStatus: string;
		}>;
		expenses: Array<{
			date: string;
			description: string;
			amount: number;
			type: 'supply' | 'salary';
		}>;
		totalAmount: number;
		totalExpenses: number;
		weeklyProfit: number;
	}

	function groupTransactionsByWeek(
		records: any[],
		supplies: any[],
		salaries: any[]
	): WeeklyTransactions[] {
		const weeklyData = new Map<string, WeeklyTransactions>();

		// Helper function to get or create week data
		const getWeekData = (date: Date) => {
			const weekRange = getWeekRange(date);
			if (!weeklyData.has(weekRange)) {
				weeklyData.set(weekRange, {
					weekRange,
					transactions: [],
					expenses: [],
					totalAmount: 0,
					totalExpenses: 0,
					weeklyProfit: 0
				});
			}
			const weekData = weeklyData.get(weekRange)!;
			// Calculate profit whenever expenses or income changes
			weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
			return weekData;
		};

		// Group transactions by week
		records.forEach((record) => {
			if (record.record?.dateDropoff) {
				const dropoffDate = new Date(record.record.dateDropoff);
				const weekData = getWeekData(dropoffDate);
				const paidAmount = parseFloat(record.order?.paidAmount || 0);

				weekData.transactions.push({
					clinic: record.clinicName,
					dateDropoff: record.record.dateDropoff,
					patientName: record.record.patientName,
					paidAmount,
					orderTotal: parseFloat(record.order?.orderTotal || 0),
					paymentMethod: record.order?.paymentMethod,
					paymentStatus: record.order?.paymentStatus
				});
				weekData.totalAmount += paidAmount;
				// Sort transactions by date after adding new one
				weekData.transactions.sort((a, b) => sortByDate(a.dateDropoff, b.dateDropoff));
				// Update profit after adding income
				weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
			}
		});

		// Group supplies by week
		supplies.forEach((supply) => {
			const supplyDate = new Date(supply.supplyDate);
			const weekData = getWeekData(supplyDate);
			const amount = parseFloat(supply.supplyCost || 0);

			weekData.expenses.push({
				date: supply.supplyDate,
				description: supply.supplyDescription || 'Supply Cost',
				amount,
				type: 'supply'
			});
			weekData.totalExpenses += amount;
			// Sort expenses by date after adding new one
			weekData.expenses.sort((a, b) => sortByDate(a.date, b.date));
			// Update profit after adding expense
			weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
		});

		// Add staff salaries to each week
		const weeks = Array.from(weeklyData.keys());

		if (weeks.length > 0) {
			salaries.forEach((staff) => {
				const weeklySalary = staff.salary / 4; // Monthly to weekly

				weeks.forEach((weekRange) => {
					const weekData = weeklyData.get(weekRange)!;

					// Add salary expense for the week
					const salaryExpense = {
						date: weekRange.split(' - ')[0],
						description: `Weekly Salary - ${staff.name}`,
						amount: weeklySalary,
						type: 'salary' as const
					};

					weekData.expenses.push(salaryExpense);
					weekData.totalExpenses += weeklySalary;
					// Update profit after adding salary expense
					weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
				});
			});
		}

		// Sort all data by date
		const sortedData = Array.from(weeklyData.values());

		// First sort all internal arrays by date
		sortedData.forEach((week) => {
			week.transactions.sort((a, b) => sortByDate(a.dateDropoff, b.dateDropoff));
			week.expenses.sort((a, b) => sortByDate(a.date, b.date));
		});

		// Then sort weeks themselves
		return sortedData.sort((a, b) =>
			sortByDate(a.weekRange.split(' - ')[0], b.weekRange.split(' - ')[0])
		);
	}

	// Helper function for sorting
	function sortByDate(a: string, b: string): number {
		return new Date(a).getTime() - new Date(b).getTime();
	}
</script>

<div class="container mx-auto flex flex-col items-center justify-center p-4">
	<div class="mb-6 flex w-full items-center justify-between">
		<h1 class="text-2xl font-bold">Financial Summary</h1>

		<!-- Month Year Picker Form -->
		<form method="POST" action="?/changeDate" class="flex items-center gap-4 print:hidden">
			<div class="flex items-center gap-4">
				<MonthYearPicker bind:selectedMonth bind:selectedYear />
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
		Showing data for: {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})}
	</div>

	<!-- Main Income Section -->
	<div class="mb-8 w-full rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Income</h2>
		<div class="overflow-x-auto">
			{#each weeklyData as week}
				<div class="mb-8">
					<h3 class="mb-4 text-lg font-semibold">Week: {week.weekRange}</h3>

					<!-- Tables Container -->
					<div class="mb-4 flex flex-col gap-4 lg:flex-row">
						<!-- Income Table -->
						<div class="w-full lg:w-3/5">
							<h4 class="text-md mb-2 font-semibold">Income</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full border-collapse rounded-lg border border-gray-200">
									<thead class="bg-gray-50">
										<tr>
											<th
												class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Clinic Name
											</th>
											<th
												class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Drop-off Date
											</th>
											<th
												class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Patient Name
											</th>
											<th
												class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Order Total
											</th>
											<th
												class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Paid Amount
											</th>
											<th
												class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Status
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each week.transactions as transaction}
											<tr>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{transaction.clinic}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{formatDate(transaction.dateDropoff)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{transaction.patientName}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
													&#8369;{transaction.orderTotal.toFixed(2)}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
													&#8369;{transaction.paidAmount.toFixed(2)}
												</td>
												<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
													<span
														class={`rounded-full px-2 py-1 text-xs font-semibold 
														${transaction.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
													>
														{transaction.paymentStatus}
													</span>
												</td>
											</tr>
										{/each}
										<tr class="bg-gray-50">
											<td
												colspan="4"
												class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900"
											>
												Weekly Total
											</td>
											<td
												colspan="2"
												class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
											>
												&#8369;{week.totalAmount.toFixed(2)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Expenses Table -->
						<div class="w-full lg:w-2/5">
							<h4 class="text-md mb-2 font-semibold">Expenses</h4>
							<div class="overflow-x-auto">
								<table class="mb-4 min-w-full border-collapse rounded-lg border border-gray-200">
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
											<th
												class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
											>
												Type
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each week.expenses as expense}
											<tr>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{formatDate(expense.date)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{expense.description}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
													&#8369;{expense.amount.toFixed(2)}
												</td>
												<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
													<span
														class={`rounded-full px-2 py-1 text-xs font-semibold 
														${
															expense.type === 'supply'
																? 'bg-blue-100 text-blue-800'
																: expense.type === 'salary'
																	? 'bg-purple-100 text-purple-800'
																	: ''
														}`}
													>
														{expense.type}
													</span>
												</td>
											</tr>
										{/each}
										<tr class="bg-gray-50">
											<td
												colspan="2"
												class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-gray-900"
											>
												Weekly Total Expenses
											</td>
											<td
												colspan="2"
												class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-gray-900"
											>
												&#8369;{week.totalExpenses.toFixed(2)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<!-- Weekly Staff Salary Input -->
							<div class="mt-4 rounded-lg bg-gray-50 p-4">
								<h5 class="mb-2 text-sm font-semibold">Add Weekly Staff Salary</h5>
								<div class="flex gap-4">
									<div class="flex-1">
										<input
											type="text"
											class="mb-2 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											placeholder="Enter staff name"
											value={salaryInputs.get(week.weekRange)?.staffName ?? ''}
											oninput={(e) => {
												const current = salaryInputs.get(week.weekRange) ?? {
													staffName: '',
													amount: 0
												};
												salaryInputs.set(week.weekRange, {
													...current,
													staffName: (e.target as HTMLInputElement).value
												});
											}}
										/>
									</div>
									<div class="flex-1">
										<input
											type="number"
											class="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
											placeholder="Enter weekly salary amount"
											min="0"
											step="0.01"
											value={salaryInputs.get(week.weekRange)?.amount ?? 0}
											oninput={(e) => {
												const current = salaryInputs.get(week.weekRange) ?? {
													staffName: '',
													amount: 0
												};
												salaryInputs.set(week.weekRange, {
													...current,
													amount: Number((e.target as HTMLInputElement).value)
												});
											}}
										/>
									</div>
									<button
										class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
										onclick={(e) => {
											e.preventDefault();
											const input = salaryInputs.get(week.weekRange);
											if (input?.amount > 0 && input?.staffName) {
												const newExpense = {
													date: week.weekRange.split(' - ')[0],
													description: `Weekly Salary - ${input.staffName}`,
													amount: input.amount,
													type: 'salary' as const
												};

												// Find the week and update it
												const weekIndex = weeklyData.findIndex(
													(w) => w.weekRange === week.weekRange
												);
												if (weekIndex !== -1) {
													const updatedWeek = {
														...weeklyData[weekIndex],
														expenses: [...weeklyData[weekIndex].expenses, newExpense],
														totalExpenses: weeklyData[weekIndex].totalExpenses + input.amount,
														weeklyProfit:
															weeklyData[weekIndex].totalAmount -
															(weeklyData[weekIndex].totalExpenses + input.amount)
													};

													// Update the array
													weeklyData = [
														...weeklyData.slice(0, weekIndex),
														updatedWeek,
														...weeklyData.slice(weekIndex + 1)
													];
												}

												// Clear inputs
												salaryInputs.delete(week.weekRange);
											}
										}}
									>
										Add
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Weekly Summary -->
					<div class="mt-4 rounded-lg bg-gray-50 p-4">
						<div class="grid grid-cols-3 gap-4">
							<div>
								<p class="text-sm font-semibold text-gray-600">Weekly Income</p>
								<p class="text-lg font-bold text-gray-900">
									&#8369;{week.totalAmount.toFixed(2)}
								</p>
							</div>
							<div>
								<p class="text-sm font-semibold text-gray-600">Weekly Expenses</p>
								<p class="text-lg font-bold text-gray-900">
									&#8369;{week.totalExpenses.toFixed(2)}
								</p>
							</div>
							<div>
								<p class="text-sm font-semibold text-gray-600">Weekly Profit</p>
								<p
									class={`text-lg font-bold ${week.weeklyProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
								>
									&#8369;{week.weeklyProfit.toFixed(2)}
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Total Profit Section -->
	<div class="w-full rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Summary</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Income</p>
				<p class="text-xl font-bold text-gray-900">
					&#8369;{totalIncome.toFixed(2)}
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Expenses</p>
				<p class="text-xl font-bold text-gray-900">
					&#8369;{totalExpenses.toFixed(2)}
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Profit</p>
				<p class={`text-xl font-bold ${totalProfit > 0 ? 'text-green-500' : 'text-red-400'}`}>
					&#8369;{totalProfit.toFixed(2)}
				</p>
			</div>
		</div>
	</div>
</div>
