<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { formatDate, generateRecordsSummary, getCurrentDateTime, getRecordDateRange } from '$lib';

	let { data, form }: PageProps = $props();
	let table = $state(data.data);
	let error = $state(false);

	let filterCaseType = $state(
		form != undefined && form?.success && form?.caseType ? form?.caseType.length > 0 : false
	);
	let filterCaseNo = $state(
		form != undefined && form?.success && form?.caseNo ? form?.caseNo.length > 0 : false
	);
	let filterRemark = $state(
		form != undefined && form?.success && form?.remark ? form?.remark.length > 0 : false
	);
	let filterDate = $state(
		form != undefined && form?.success && form?.start_date ? form?.start_date.length > 0 : false
	);

	if (form?.success) {
		table = form.data;
		if (form.data.length === 0) {
			error = true;
		}
	} else if (form !== undefined && form?.success === false) {
		error = true;
	}
	console.log(data.data);
	let selectedClinic = $state<string | null>(
		form != undefined && form.success ? form.clinicName : data.clinicName || ''
	);
	let startDate: string | null = $state(form != undefined && form.success ? form.start_date : null);
	let endDate: string | null = $state(form != undefined && form.success ? form.end_date : null);
	let searchClinic = $state(
		form != undefined && form.success ? form.clinicName : data.clinicName || ''
	);
	let isDropdownOpen = $state(false);
	let isDeleting = $state(false);
	let filteredClinics = $derived(
		data?.clinics?.filter((clinic) =>
			clinic.label.toLowerCase().includes(searchClinic.toLowerCase())
		) || []
	);

	function handleInputChange(event: Event) {
		searchClinic = (event.target as HTMLInputElement).value;
		isDropdownOpen = true;
	}

	function selectClinic(clinicValue: string) {
		selectedClinic = clinicValue;
		searchClinic = data?.clinics?.find((c) => c.value === clinicValue)?.label || '';
		isDropdownOpen = false;
	}

	function handleBlur() {
		// Keep dropdown open briefly to allow clicks
		setTimeout(() => {
			isDropdownOpen = false;
		}, 150);
	}

	let sortColumn = $state<number | null>(null);
	let sortDirection = $state<'asc' | 'desc'>('asc');

	function sortTable(columnIndex: number) {
		if ([3, 5, 2, 11, 12].includes(columnIndex)) {
			if (sortColumn === columnIndex) {
				sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
			} else {
				sortColumn = columnIndex;
				sortDirection = 'asc';
			}

			table = [...table].sort((a, b) => {
				const key = Object.keys(a)[columnIndex];
				const valueA = a[key];
				const valueB = b[key];

				let comparison = 0;
				if (typeof valueA === 'string' && typeof valueB === 'string') {
					comparison = valueA.localeCompare(valueB);
				} else if (typeof valueA === 'number' && typeof valueB === 'number') {
					comparison = valueA - valueB;
				} else if (valueA < valueB) {
					comparison = -1;
				} else if (valueA > valueB) {
					comparison = 1;
				}

				return sortDirection === 'asc' ? comparison : comparison * -1;
			});
		}
	}

	let customerName = form?.success ? form.clinicName : data.clinicName;

	let displayedKeys = [3, 5, 9, 2, 10, 11, 12, 15];
</script>

<div class="flex flex-col">
	<div class="m-2 flex flex-wrap items-center gap-4 print:hidden">
		<form method="POST" action="?/filter" class="flex items-center gap-2">
			<label class="flex items-center gap-1">
				<label for="clinic_name" class="relative flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">Clinic</h1>
					<input
						type="text"
						placeholder="Search Clinic"
						bind:value={searchClinic}
						oninput={handleInputChange}
						onfocus={() => (isDropdownOpen = true)}
						onblur={handleBlur}
						class="w-48 rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					/>
					{#if isDropdownOpen && filteredClinics.length > 0}
						<div
							class="absolute top-full left-0 z-10 mt-1 w-48 rounded border border-gray-300 bg-white shadow-md"
						>
							{#each filteredClinics as clinic}
								<button
									type="button"
									class="block w-full p-2 text-left transition duration-150 ease-in-out hover:bg-gray-100 focus:bg-indigo-50 focus:outline-none"
									onclick={() => selectClinic(clinic.value)}
								>
									{clinic.label}
								</button>
							{/each}
						</div>
					{/if}
					{#if selectedClinic}
						<input type="hidden" name="clinic_name" value={selectedClinic} />
					{/if}
				</label>
			</label>

			<label class="flex items-center gap-1">
				<input
					type="checkbox"
					name="filter_case_type"
					bind:checked={filterCaseType}
					class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<label for="case_type" class="flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">Case Type</h1>
					<select
						name="case_type"
						class="w-32 rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						disabled={!filterCaseType}
					>
						{#each data.caseTypes as caseType}
							{#if form?.success && form.caseType}
								<option value={caseType.caseType} selected={caseType.caseType === form.caseType}>
									{caseType.caseType}
								</option>
							{:else}
								<option value={caseType.caseType}>
									{caseType.caseType}
								</option>
							{/if}
						{/each}
					</select>
				</label>
			</label>

			<label class="flex items-center gap-1">
				<input
					type="checkbox"
					name="filter_case_no"
					bind:checked={filterCaseNo}
					class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<label for="case_no" class="flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">Case No</h1>
					<input
						type="number"
						name="case_no"
						defaultValue={data.caseNo || (form != undefined ? form?.caseNo : '')}
						placeholder="Enter Case No"
						class="w-32 rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						disabled={!filterCaseNo}
					/>
				</label>
			</label>

			<label class="flex items-center gap-1">
				<input
					type="checkbox"
					name="filter_remark"
					bind:checked={filterRemark}
					class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<label for="remark" class="flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">Remark</h1>
					<select
						name="remark"
						class="w-32 rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						disabled={!filterRemark}
					>
						{#each ['finished', 'pending'] as remark}
							{#if form?.success}
								<option value={remark} selected={remark === form.remark}>
									{remark}
								</option>
							{:else}
								<option value={remark}>
									{remark}
								</option>
							{/if}
						{/each}
					</select>
				</label>
			</label>

			<label class="flex items-center gap-1">
				<input
					type="checkbox"
					name="filter_start_date"
					bind:checked={filterDate}
					class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<label for="start_date" class="flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">Start Date</h1>
					<input
						type="date"
						name="start_date"
						bind:value={startDate}
						class="rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						disabled={!filterDate}
						required={filterDate}
					/>
				</label>
			</label>

			<label class="flex items-center gap-1">
				<label for="end_date" class="flex flex-col items-start gap-1">
					<h1 class="text-sm font-semibold text-gray-700">End Date</h1>
					<input
						type="date"
						name="end_date"
						bind:value={endDate}
						class="rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						disabled={!filterDate}
						required={filterDate}
					/>
				</label>
			</label>

			<button
				class="self-end rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				type="submit"
				disabled={!selectedClinic &&
					!filterCaseType &&
					!filterCaseNo &&
					!filterRemark &&
					!filterDate}
			>
				QUERY
			</button>
			<button
				class="self-end rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				onclick={async () => {
					await goto('/');
					window.location.reload();
				}}
				type="button"
			>
				RESET
			</button>
		</form>
		<div class="flex flex-col items-center gap-2">
			<h1 class="text-sm font-medium">Delete mode:</h1>
			<label class="relative inline-flex cursor-pointer items-center">
				<input type="checkbox" bind:checked={isDeleting} class="peer sr-only" />
				<div
					class="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full dark:border-gray-600 dark:bg-gray-700 dark:peer-focus:ring-blue-800"
				></div>
			</label>
		</div>
	</div>

	<div id="printarea" class="flex flex-col">
		{#if form?.success}
			<div class="flex flex-row items-start justify-between space-x-12 p-6">
				<div class="flex flex-col">
					<h1 class="text-2xl font-bold text-gray-900">CASSEY DENTAL LABORATORY</h1>
					<h2 class="mt-1 text-xl font-semibold text-gray-700">STATEMENT OF ACCOUNT</h2>
				</div>

				<div class="flex flex-col items-start space-y-1.5 pt-1 text-sm text-gray-800">
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">PRINT DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{getCurrentDateTime().fullDateTime}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-fit pr-2 text-right font-medium text-gray-600">CUSTOMER NAME:</span>
						<span class="inline-block w-40 border-b border-gray-500">{customerName}</span>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">START DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{formatDate(getRecordDateRange(form.data).startingDate)}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">END DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{formatDate(getRecordDateRange(form.data).recentDate)}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">STATUS:</span>
						<span class="inline-block w-40 font-semibold text-gray-900"
							>{generateRecordsSummary(form.data).processStatus} - {generateRecordsSummary(
								form.data
							).financialStatus}
						</span>
					</div>
				</div>
			</div>
		{:else if data.hasQuery}
			<div class="flex flex-row items-start justify-between space-x-12 p-6">
				<div class="flex flex-col">
					<h1 class="text-2xl font-bold text-gray-900">CASSEY DENTAL LABORATORY</h1>
					<h2 class="mt-1 text-xl font-semibold text-gray-700">STATEMENT OF ACCOUNT</h2>
				</div>

				<div class="flex flex-col items-start space-y-1.5 pt-1 text-sm text-gray-800">
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">PRINT DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{getCurrentDateTime().fullDateTime}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-fit pr-2 text-right font-medium text-gray-600">CUSTOMER NAME:</span>
						<span class="inline-block w-40 border-b border-gray-500">{customerName}</span>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">START DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{formatDate(getRecordDateRange(data.data).startingDate)}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">END DATE:</span>
						<span class="inline-block w-40 border-b border-gray-500"
							>{formatDate(getRecordDateRange(data.data).recentDate)}</span
						>
					</div>
					<div class="flex items-baseline">
						<span class="w-32 pr-2 text-right font-medium text-gray-600">STATUS:</span>
						<span class="inline-block w-40 font-semibold text-gray-900"
							>{generateRecordsSummary(data.data).processStatus} - {generateRecordsSummary(
								data.data
							).financialStatus}
						</span>
					</div>
				</div>
			</div>
		{/if}
		{#if !error && data.data.length > 0}
			<table
				class="mx-5 mt-2 w-[97%] border-collapse text-left text-sm text-gray-500 rtl:text-right"
			>
				<thead class="bg-gray-100 text-center text-xs text-gray-700 uppercase">
					<tr>
						{#each displayedKeys as keyIndex}
							<th
								class="cursor-pointer border border-gray-300 px-6 py-3 font-semibold text-gray-700"
								onclick={() => sortTable(keyIndex)}
							>
								{Object.keys(table[0])
									[keyIndex]?.replace(/([A-Z])/g, ' $1')
									?.trim()}
								{#if sortColumn === keyIndex}
									{sortDirection === 'asc' ? '▲' : '▼'}
								{/if}
							</th>
						{/each}
						<th class="border border-gray-300 px-6 py-3 font-semibold text-gray-700 print:hidden">
							HISTORY
						</th>
						<th class="border border-gray-300 px-6 py-3 font-semibold text-gray-700 print:hidden">
							ACTIONS
						</th>
						{#if isDeleting}
							<th
								class="border border-gray-300 bg-red-300 px-6 py-3 font-semibold text-gray-700 print:hidden"
							>
								DELETE
							</th>
						{/if}
					</tr>
				</thead>
				<tbody class="bg-white">
					{#each table as row, index}
						<tr class={`border-gray-300 ${+row.excessPayment >= 0 ? 'bg-blue-50' : 'bg-red-100'}`}>
							{#each displayedKeys as keyIndex}
								<td class="border border-gray-300 px-6 py-4 text-gray-900">
									{#if keyIndex === 11 || keyIndex === 12}
										<span>&#8369;</span>
									{/if}
									{#if keyIndex === 2}
										<span>{row[Object.keys(table[0])[1]]} -</span>
									{/if}
									{row[Object.keys(table[0])[keyIndex]]}
								</td>
							{/each}
							<td class="border border-gray-300 px-6 py-4 print:hidden">
								<a
									aria-label="history"
									href={`/history/${row[Object.keys(table[0])[0]]}`}
									class="text-blue-500 no-underline hover:underline"
								>
									LINK
								</a>
							</td>
							<td
								class=" flex flex-row justify-between border border-gray-300 px-6 py-4 text-center print:hidden"
							>
								<a
									aria-label="in"
									href={`/IN/${row[Object.keys(table[0])[0]]}`}
									class=" inline-block rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-blue-700"
								>
									IN
								</a>
								<a
									aria-label="out"
									href={`/OUT/${row[Object.keys(table[0])[0]]}`}
									class="inline-block rounded bg-orange-400 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-orange-600"
								>
									OUT
								</a>
								<a
									aria-label="out"
									href={`/AMOUNT/${row[Object.keys(table[0])[0]]}`}
									class="inline-block rounded bg-yellow-400 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-yellow-600"
								>
									AMOUNT
								</a>
							</td>
							{#if isDeleting}
								<td
									class="justify-between border border-gray-300 px-6 py-4 text-center print:hidden"
								>
									<form action="?/deleteCase" method="post">
										<button
											type="submit"
											aria-label="in"
											class=" inline-block rounded bg-red-300 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-blue-700"
										>
											DELETE
										</button>
										<input
											type="text"
											value={row[Object.keys(table[0])[0]]}
											name="case_delete"
											hidden
										/>
									</form>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		{#if !form?.success && form?.error}
			<div class="flex h-screen items-center justify-center">
				<h1 class="text-2xl font-semibold text-red-500">{form.error}</h1>
			</div>
		{/if}
		{#if error || data.data.length === 0}
			<div class="flex h-screen items-center justify-center">
				<h1 class="text-2xl font-semibold text-red-500">No Data Found</h1>
			</div>
		{/if}
	</div>
</div>

<style>
	@media print {
		#printarea {
			display: block;
			-webkit-print-color-adjust: exact;
		}
	}
	@page {
		size: landscape;
	}
</style>
