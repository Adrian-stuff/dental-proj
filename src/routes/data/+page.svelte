<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Chart from 'chart.js/auto';
	import type { PageData } from './$types';

	export let data: PageData;

	let dailyChartCanvas: HTMLCanvasElement;
	let clinicChartCanvas: HTMLCanvasElement;
	let caseTypeChartCanvas: HTMLCanvasElement;
	let dailyChart: Chart<'bar', number[], string>;
	let clinicChart: Chart<'bar', number[], string>;
	let caseTypeChart: Chart<'bar', number[], string>;

	// Handle period change
	function handlePeriodChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		updateFilters({ period: select.value });
	}

	// Handle date changes
	function handleDateChange(event: Event, field: 'startDate' | 'endDate') {
		const input = event.target as HTMLInputElement;
		const value = input.value + '-01'; // Add day for proper date format
		updateFilters({ [field]: value });
	}

	// Handle clinic filtering
	function filterByClinic(event: Event) {
		const select = event.target as HTMLSelectElement;
		updateFilters({ clinic: select.value });
	}

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	};

	// Handle date format for input
	const formatDateForInput = (dateString: string) => {
		const date = new Date(dateString);
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
	};

	// Add reactive statement to update charts when data changes
	$: if (dailyChart) {
		dailyChart.data.labels = Object.keys(data.chartData);
		dailyChart.data.datasets[0].label = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`;
		dailyChart.data.datasets[0].data = Object.values(data.chartData) as number[];
		dailyChart.options.plugins.title.text = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue`;
		dailyChart.update();
	}

	$: if (caseTypeChart) {
		caseTypeChart.data.labels = Object.keys(data.summary.caseTypeTotals);
		caseTypeChart.data.datasets[0].data = Object.values(data.summary.caseTypeTotals) as number[];
		caseTypeChart.update();
	}

	onMount(() => {
		// Main chart
		dailyChart = new Chart(dailyChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.chartData),
				datasets: [
					{
						label: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`,
						data: Object.values(data.chartData) as number[],
						backgroundColor: 'rgba(75, 192, 192, 0.5)',
						borderColor: 'rgb(75, 192, 192)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency(context.parsed.y)
						}
					},
					title: {
						display: true,
						text: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue`
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => formatCurrency(value as number)
						}
					},
					x: {
						ticks: {
							maxRotation: 45,
							minRotation: 45
						}
					}
				}
			}
		});

		// Clinic chart
		clinicChart = new Chart(clinicChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.clinicChartData),
				datasets: [
					{
						label: 'Total Amount per Clinic',
						data: Object.values(data.clinicChartData) as number[],
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)'
						]
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency(context.parsed.y)
						}
					}
				}
			}
		});

		// Case Type Units chart
		caseTypeChart = new Chart(caseTypeChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.summary.caseTypeTotals),
				datasets: [
					{
						label: 'Units per Case Type',
						data: Object.values(data.summary.caseTypeTotals) as number[],
						backgroundColor: [
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)',
							'rgba(255, 159, 64, 0.5)'
						],
						borderColor: [
							'rgb(54, 162, 235)',
							'rgb(255, 206, 86)',
							'rgb(75, 192, 192)',
							'rgb(153, 102, 255)',
							'rgb(255, 159, 64)'
						],
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Case Type Distribution'
					},
					tooltip: {
						callbacks: {
							label: (context) => `${context.parsed.y} units`
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Number of Units'
						}
					}
				}
			}
		});

		return () => {
			dailyChart.destroy();
			clinicChart.destroy();
			caseTypeChart.destroy();
		};
	});

	// Update filters and URL
	function updateFilters(updates: Record<string, string>) {
		const url = new URL(window.location.href);
		Object.entries(updates).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-2xl font-bold">Data Summary</h1>

	<div class="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
		<!-- Period selector -->
		<div>
			<label for="period" class="font-medium">View by:</label>
			<select
				id="period"
				class="ml-2 rounded border p-2"
				value={data.selectedPeriod}
				on:change={handlePeriodChange}
			>
				<option value="month">Monthly</option>
				<option value="day">Daily</option>
			</select>
		</div>

		<!-- Date filters -->
		<div>
			<label for="startDate" class="font-medium">Start Date:</label>
			<input
				type="month"
				id="startDate"
				class="ml-2 rounded border p-2"
				value={formatDateForInput(data.dateRange.start)}
				on:change={(e) => handleDateChange(e, 'startDate')}
			/>
		</div>
		<div>
			<label for="endDate" class="font-medium">End Date:</label>
			<input
				type="month"
				id="endDate"
				class="ml-2 rounded border p-2"
				value={data.dateRange.end.substring(0, 7)}
				on:change={(e) => handleDateChange(e, 'endDate')}
			/>
		</div>

		<!-- Clinic filter -->
		<div>
			<label for="clinic" class="font-medium">Filter by Clinic:</label>
			<select
				id="clinic"
				class="ml-2 rounded border p-2"
				value={data.selectedClinic}
				on:change={filterByClinic}
			>
				<option value="all">All Clinics</option>
				{#each data.clinics as clinic}
					<option value={clinic.id}>{clinic.name}</option>
				{/each}
			</select>
		</div>
	</div>

	<!-- Case Types Summary -->
	<div class="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
		{#each Object.entries(data.summary.caseTypeTotals) as [type, count]}
			<div class="rounded-lg bg-white p-4 shadow">
				<h3 class="text-lg font-medium">{type}</h3>
				<p class="text-2xl">{count} units</p>
			</div>
		{/each}
	</div>

	<!-- Summary cards -->
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

	<!-- Charts -->
	<div class="mt-8 grid grid-cols-1 gap-8">
		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">
				{data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount
			</h2>
			<canvas bind:this={dailyChartCanvas}></canvas>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Total Amount per Clinic</h2>
			<canvas bind:this={clinicChartCanvas}></canvas>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Case Type Distribution</h2>
			<canvas bind:this={caseTypeChartCanvas}></canvas>
		</div>
	</div>
</div>
