<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData, supplies } = data;
	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);
	let remarksValue = $state('finished');
	let statusValue = $state('');
	let clinicValue = $state('');

	const clinicOptions = $derived([
		{ value: '', label: 'All Clinics' },
		...((data as any).clinics?.map((clinic: any) => ({
			value: clinic.clinicId.toString(),
			label: clinic.clinicName
		})) || [])
	]);

	onMount(() => {
		try {
			const p = new URLSearchParams(window.location.search);
			const remarksParam = p.get('remarks');
			// If remarks parameter doesn't exist, default to 'finished' and update URL
			// If it exists (even if empty string), use that value
			if (remarksParam === null) {
				remarksValue = 'finished';
				p.set('remarks', 'finished');
				const base = window.location.pathname + '?' + p.toString();
				window.history.replaceState({}, '', base);
			} else {
				remarksValue = remarksParam || '';
			}
			statusValue = p.get('status') || '';
			clinicValue = p.get('clinic_id') || '';
		} catch (e) {
			// noop
		}
	});

	interface ClientTransaction {
		name: string;
		transactions: Array<{
			dateDropoff: string;
			patientName: string;
			paidAmount: number;
			orderTotal: number;
			paymentMethod: string;
			paymentStatus: string;
			remarks: string;
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
					paymentStatus: record.order?.paymentStatus,
					record: record.record // Add the full record object
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

	// Centralized financial data state
	let financialData = $state({
		weekly: [] as WeeklyTransactions[],
		totalIncome: 0,
		totalSupply: 0,
		totalSalaries: 0,
		totalExpenses: 0,
		totalWeeklyExpenses: 0,
		totalProfit: 0
	});

	function recalculateFinancialData() {
		// Calculate weekly data
		const weekly = groupTransactionsByWeek(recordData, supplies, staffSalaries);
		// Calculate totals
		const totalIncome = calculateTotalIncome(recordData);
		const totalSupply = calculateTotalSupply(supplies);
		const totalSalaries = staffSalaries.reduce((total, staff) => total + staff.salary, 0);
		const totalWeeklyExpenses = weekly.reduce((total, week) => total + week.totalExpenses, 0);
		// FIX: totalExpenses should only be totalWeeklyExpenses (no double counting)
		const totalExpenses = totalWeeklyExpenses;
		const totalProfit = totalIncome - totalExpenses;
		financialData = {
			weekly,
			totalIncome,
			totalSupply,
			totalSalaries,
			totalExpenses,
			totalWeeklyExpenses,
			totalProfit
		};
	}

	// Recalculate whenever dependencies change
	$effect(() => {
		recalculateFinancialData();
	});

	// Add weekly salary from input
	function addWeeklySalary(weekRange: string, staffName: string, amount: number) {
		if (amount > 0 && staffName) {
			// Find the week and update it
			const weekIndex = financialData.weekly.findIndex((w) => w.weekRange === weekRange);
			if (weekIndex !== -1) {
				const newExpense = {
					date: weekRange.split(' - ')[0],
					description: `Weekly Salary - ${staffName}`,
					amount,
					type: 'salary' as const
				};
				const updatedWeek = {
					...financialData.weekly[weekIndex],
					expenses: [...financialData.weekly[weekIndex].expenses, newExpense],
					totalExpenses: financialData.weekly[weekIndex].totalExpenses + amount,
					weeklyProfit:
						financialData.weekly[weekIndex].totalAmount -
						(financialData.weekly[weekIndex].totalExpenses + amount)
				};
				// Update the array
				const updatedWeekly = [
					...financialData.weekly.slice(0, weekIndex),
					updatedWeek,
					...financialData.weekly.slice(weekIndex + 1)
				];
				// Recalculate totals based only on updated weekly data
				const totalWeeklyExpenses = updatedWeekly.reduce(
					(total, week) => total + week.totalExpenses,
					0
				);
				const totalExpenses = totalWeeklyExpenses;
				const totalProfit = financialData.totalIncome - totalExpenses;
				financialData = {
					...financialData,
					weekly: updatedWeekly,
					totalWeeklyExpenses,
					totalExpenses,
					totalProfit
				};
			}
		}
	}
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
			balance?: number;
			record?: {
				remarks: string;
				patientName: string;
				dateDropoff: string;
			};
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

				const balance =
					record.order?.balance ?? parseFloat(record.order?.orderTotal || 0) - paidAmount;

				weekData.transactions.push({
					clinic: record.clinicName,
					dateDropoff: record.record.dateDropoff,
					patientName: record.record.patientName,
					paidAmount,
					orderTotal: parseFloat(record.order?.orderTotal || 0),
					balance,
					paymentMethod: record.order?.paymentMethod,
					paymentStatus: record.order?.paymentStatus,
					record: {
						remarks: record.record.remarks || 'pending',
						patientName: record.record.patientName,
						dateDropoff: record.record.dateDropoff
					}
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

	type IncomeSortColumn =
		| 'date'
		| 'clinic'
		| 'patient'
		| 'orderTotal'
		| 'paidAmount'
		| 'status'
		| 'remarks';

	type ExpensesSortColumn = 'date' | 'description' | 'amount' | 'type';

	type SortDirection = 'asc' | 'desc';

	let incomeSort = $state<{ column: IncomeSortColumn; direction: SortDirection }>({
		column: 'date',
		direction: 'asc'
	});

	let expensesSort = $state<{ column: ExpensesSortColumn; direction: SortDirection }>({
		column: 'date',
		direction: 'asc'
	});

	function toggleIncomeSort(column: IncomeSortColumn) {
		if (incomeSort.column === column) {
			incomeSort = {
				...incomeSort,
				direction: incomeSort.direction === 'asc' ? 'desc' : 'asc'
			};
		} else {
			incomeSort = { column, direction: 'asc' };
		}
	}

	function toggleExpensesSort(column: ExpensesSortColumn) {
		if (expensesSort.column === column) {
			expensesSort = {
				...expensesSort,
				direction: expensesSort.direction === 'asc' ? 'desc' : 'asc'
			};
		} else {
			expensesSort = { column, direction: 'asc' };
		}
	}

	function compareValues(a: string | number, b: string | number, direction: SortDirection): number {
		let result: number;

		if (typeof a === 'number' && typeof b === 'number') {
			result = a - b;
		} else {
			const aStr = String(a).toLowerCase();
			const bStr = String(b).toLowerCase();
			if (aStr < bStr) result = -1;
			else if (aStr > bStr) result = 1;
			else result = 0;
		}

		return direction === 'asc' ? result : -result;
	}

	function sortIncomeTransactions(
		a: WeeklyTransactions['transactions'][number],
		b: WeeklyTransactions['transactions'][number]
	): number {
		switch (incomeSort.column) {
			case 'date':
				return incomeSort.direction === 'asc'
					? sortByDate(a.dateDropoff, b.dateDropoff)
					: sortByDate(b.dateDropoff, a.dateDropoff);
			case 'clinic':
				return compareValues(a.clinic, b.clinic, incomeSort.direction);
			case 'patient':
				return compareValues(a.patientName, b.patientName, incomeSort.direction);
			case 'orderTotal':
				return compareValues(a.orderTotal, b.orderTotal, incomeSort.direction);
			case 'paidAmount':
				return compareValues(a.paidAmount, b.paidAmount, incomeSort.direction);
			case 'status':
				return compareValues(a.paymentStatus, b.paymentStatus, incomeSort.direction);
			case 'remarks':
				return compareValues(
					a.record?.remarks ?? 'pending',
					b.record?.remarks ?? 'pending',
					incomeSort.direction
				);
		}
	}

	function sortExpenses(
		a: WeeklyTransactions['expenses'][number],
		b: WeeklyTransactions['expenses'][number]
	): number {
		switch (expensesSort.column) {
			case 'date':
				return expensesSort.direction === 'asc'
					? sortByDate(a.date, b.date)
					: sortByDate(b.date, a.date);
			case 'description':
				return compareValues(a.description, b.description, expensesSort.direction);
			case 'amount':
				return compareValues(a.amount, b.amount, expensesSort.direction);
			case 'type':
				return compareValues(a.type, b.type, expensesSort.direction);
		}
	}

	function getSortedTransactions(week: WeeklyTransactions) {
		return [...week.transactions].sort((a, b) => sortIncomeTransactions(a, b));
	}

	function getSortedExpenses(week: WeeklyTransactions) {
		return [...week.expenses].sort((a, b) => sortExpenses(a, b));
	}

	function deleteWeeklySalaryExpense(weekRange: string, expenseIndex: number) {
		const weekIndex = financialData.weekly.findIndex((w) => w.weekRange === weekRange);
		if (weekIndex !== -1) {
			const week = financialData.weekly[weekIndex];
			const expenseToDelete = week.expenses[expenseIndex];
			if (expenseToDelete && expenseToDelete.type === 'salary') {
				const updatedExpenses = week.expenses.filter((_, i) => i !== expenseIndex);
				const updatedTotalExpenses = week.totalExpenses - expenseToDelete.amount;
				const updatedWeek = {
					...week,
					expenses: updatedExpenses,
					totalExpenses: updatedTotalExpenses,
					weeklyProfit: week.totalAmount - updatedTotalExpenses
				};
				const updatedWeekly = [
					...financialData.weekly.slice(0, weekIndex),
					updatedWeek,
					...financialData.weekly.slice(weekIndex + 1)
				];
				financialData = {
					...financialData,
					weekly: updatedWeekly
				};
				// Ensure all totals and summaries are recalculated
				recalculateFinancialData();
			}
		}
	}
</script>

<div class="flex w-full flex-col p-4">
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

		<!-- Filters -->
		<div class="flex items-center gap-2">
			<label for="payment-status-filter" class="text-sm text-gray-600">Payment Status</label>
			<select
				id="payment-status-filter"
				class="rounded-md border-gray-300 p-2"
				value={statusValue}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value;
					statusValue = val;
					const params = new URLSearchParams(window.location.search);
					if (val) params.set('status', val);
					else params.delete('status');
					const base = window.location.pathname + '?' + params.toString();
					window.location.href = base;
				}}
			>
				<option value="">All</option>
				<option value="paid">paid</option>
				<option value="unpaid">unpaid</option>
			</select>

			<!-- Remarks filter -->
			<label for="remarks-filter" class="text-sm text-gray-600">Remarks</label>
			<select
				id="remarks-filter"
				class="rounded-md border-gray-300 p-2"
				value={remarksValue}
				onchange={(e) => {
					const val = (e.target as HTMLSelectElement).value;
					remarksValue = val;
					const params = new URLSearchParams(window.location.search);
					// Always set the parameter, use empty string for "All" to explicitly show all
					params.set('remarks', val || '');
					const base = window.location.pathname + '?' + params.toString();
					window.location.href = base;
				}}
			>
				<option value="">All</option>
				<option value="finished">finished</option>
				<option value="pending">pending</option>
			</select>

			<!-- Clinic filter -->
			<SearchableSelect
				options={clinicOptions}
				bind:value={clinicValue}
				label="Clinic"
				placeholder="Search clinic..."
				onchange={(val) => {
					const params = new URLSearchParams(window.location.search);
					if (val) params.set('clinic_id', val);
					else params.delete('clinic_id');
					const base = window.location.pathname + '?' + params.toString();
					window.location.href = base;
				}}
			/>
		</div>
	</div>

	<!-- Display selected month and year -->
	<div class="mb-4 w-full text-sm text-gray-500">
		Showing data for: {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})}
	</div>

	<!-- Total Profit Section -->
	<div class="mb-2 w-full rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Summary</h2>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Income</p>
				<p class="text-xl font-bold text-gray-900">
					&#8369;{financialData.totalIncome.toFixed(2)}
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Expenses</p>
				<p class="text-xl font-bold text-gray-900">
					&#8369;{financialData.totalExpenses.toFixed(2)}
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Unpaid</p>
				<p class="text-xl font-bold text-red-600">
					&#8369;{financialData.weekly
						.reduce(
							(total, week) =>
								total +
								week.transactions.reduce(
									(weekTotal, t) => weekTotal + (t.orderTotal - t.paidAmount),
									0
								),
							0
						)
						.toFixed(2)}
				</p>
			</div>
			<div>
				<p class="text-sm font-semibold text-gray-600">Total Profit</p>
				<p
					class={`text-xl font-bold ${financialData.totalProfit > 0 ? 'text-green-500' : 'text-red-400'}`}
				>
					&#8369;{financialData.totalProfit.toFixed(2)}
				</p>
			</div>
		</div>
	</div>
	<!-- Main Income Section -->
	<div class=" w-full rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Income</h2>
		<div class="overflow-x-auto">
			{#each financialData.weekly as week}
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
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('date')}
											>
												Drop-off Date
												{#if incomeSort.column === 'date'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('clinic')}
											>
												Clinic Name
												{#if incomeSort.column === 'clinic'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('patient')}
											>
												Patient Name
												{#if incomeSort.column === 'patient'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('orderTotal')}
											>
												Order Total
												{#if incomeSort.column === 'orderTotal'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('paidAmount')}
											>
												Paid Amount
												{#if incomeSort.column === 'paidAmount'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleIncomeSort('status')}
											>
												Status / Remarks
												{#if incomeSort.column === 'status' || incomeSort.column === 'remarks'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each getSortedTransactions(week) as transaction}
											<tr
												class={`
												border-b border-gray-200 transition-colors
												${
													transaction.paymentStatus === 'paid' &&
													(transaction.record?.remarks || 'pending') === 'finished'
														? 'bg-green-200'
														: transaction.paymentStatus === 'unpaid' &&
															  (transaction.record?.remarks || 'pending') === 'finished'
															? 'bg-red-300'
															: transaction.paymentStatus === 'unpaid' &&
																  (transaction.record?.remarks || 'pending') === 'pending'
																? 'bg-white'
																: 'bg-violet-300'
												}
											`}
											>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{formatDate(transaction.dateDropoff)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
													{transaction.clinic}
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
													<span
														class="ml-2 rounded-full px-2 py-1 text-xs font-semibold"
														class:bg-green-100={transaction.record?.remarks === 'finished'}
														class:text-green-800={transaction.record?.remarks === 'finished'}
														class:bg-yellow-100={transaction.record?.remarks === 'pending'}
														class:text-yellow-800={transaction.record?.remarks === 'pending'}
													>
														{transaction.record?.remarks || 'pending'}
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
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleExpensesSort('date')}
											>
												Date
												{#if expensesSort.column === 'date'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleExpensesSort('description')}
											>
												Description
												{#if expensesSort.column === 'description'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleExpensesSort('amount')}
											>
												Amount
												{#if expensesSort.column === 'amount'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase select-none"
												onclick={() => toggleExpensesSort('type')}
											>
												Type
												{#if expensesSort.column === 'type'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-gray-200 bg-white">
										{#each getSortedExpenses(week) as expense, expenseIndex}
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
													{#if expense.type === 'salary'}
														<button
															type="button"
															class="ml-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-700"
															onclick={() =>
																deleteWeeklySalaryExpense(week.weekRange, expenseIndex)}
														>
															Delete
														</button>
													{/if}
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
												addWeeklySalary(week.weekRange, input.staffName, input.amount);
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
						<div class="grid grid-cols-4 gap-4">
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
								<p class="text-sm font-semibold text-gray-600">Total Unpaid</p>
								<p class="text-lg font-bold text-red-600">
									&#8369;{week.transactions
										.reduce((total, t) => total + (t.orderTotal - t.paidAmount), 0)
										.toFixed(2)}
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
</div>
