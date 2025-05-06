<script lang="ts">
	import { redirect } from '@sveltejs/kit';
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';

	let { data, form }: PageProps = $props();
	let table = $state(data.data);
	let error = $state(false);
	if (form?.success) {
		table = form.data;
		if (form.data.length === 0) {
			error = true;
		}
	}

	let selectedClinic = $state<string | null>(
		form != undefined && form.success ? form.clinicName : data.clinicName || ''
	);
	let startDate: string | null = $state(form != undefined && form.success ? form.start_date : null);
	let endDate: string | null = $state(form != undefined && form.success ? form.end_date : null);
	let searchClinic = $state(data.clinicName || '');
	let isDropdownOpen = $state(false);
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

	let displayedKeys = [3, 5, 9, 2, 10, 11, 12];
</script>

<div class="flex flex-col">
	<div class="m-2 flex flex-wrap items-center gap-4 print:hidden">
		<form method="POST" action="?/clinics" class="flex items-center gap-2">
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
					<input type="hidden" name="clinic_name" value={selectedClinic} required />
				{/if}
			</label>
			<button
				class="self-end rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-400 sm:text-sm"
				type="submit"
				disabled={!selectedClinic}
			>
				QUERY
			</button>
		</form>
		<form method="POST" action="?/caseNo" class="flex items-center gap-2">
			<label for="case_no" class="flex flex-col items-start gap-1">
				<h1 class="text-sm font-semibold text-gray-700">Case No</h1>
				<input
					type="number"
					name="case_no"
					defaultValue={data.caseNo || ''}
					placeholder="Enter Case No"
					class="w-32 rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					required
				/>
			</label>
			<button
				class="self-end rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				type="submit"
			>
				QUERY
			</button>
		</form>
		<form method="POST" action="?/date" class="flex items-center gap-2">
			<label for="start_date" class="flex flex-col items-start gap-1">
				<h1 class="text-sm font-semibold text-gray-700">Start Date</h1>
				<input
					type="date"
					name="start_date"
					bind:value={startDate}
					class="rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					required
				/>
			</label>
			<label for="end_date" class="flex flex-col items-start gap-1">
				<h1 class="text-sm font-semibold text-gray-700">End Date</h1>
				<input
					type="date"
					name="end_date"
					bind:value={endDate}
					class="rounded border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					required
				/>
			</label>
			<button
				class="self-end rounded border border-gray-300 bg-green-500 p-2 text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				type="submit"
			>
				FILTER BY DATE
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
		<div class="absolute top-7 right-5 flex justify-between gap-2">
			<a
				class=" rounded border border-gray-300 bg-gray-500 p-2 text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/edit_info">EDIT INFOS</a
			>
			<button
				onclick={() => window.print()}
				class=" rounded border border-gray-300 bg-red-500 p-2 text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				>PRINT</button
			>
			<a
				class=" rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/upload_record">ADD RECORD</a
			>
		</div>
	</div>

	<div id="printarea" class="flex flex-col">
		{#if form?.success || data.hasQuery}
			<div class="grid-row-3 grid px-2">
				<div>
					<h1 class="text-lg font-semibold text-gray-800">SOA CLINIC</h1>
				</div>
				<div class="text-center">
					<h1 class="text-4xl font-bold text-indigo-600">
						{form?.success ? form.clinicName : data.clinicName}
					</h1>
				</div>
			</div>
		{/if}
		{#if !error}
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
									{row[Object.keys(table[0])[keyIndex]]}
								</td>
							{/each}
							<td class="border border-gray-300 px-6 py-4 print:hidden">
								<a
									aria-label="history"
									href={`/history/${row[Object.keys(table[0])[2]]}`}
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
									href={`/IN/${row[Object.keys(table[0])[2]]}`}
									class=" inline-block rounded bg-blue-500 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-blue-700"
								>
									IN
								</a>
								<a
									aria-label="out"
									href={`/OUT/${row[Object.keys(table[0])[2]]}`}
									class="inline-block rounded bg-orange-400 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-orange-600"
								>
									OUT
								</a>
								<a
									aria-label="out"
									href={`/AMOUNT/${row[Object.keys(table[0])[2]]}`}
									class="inline-block rounded bg-yellow-400 px-3 py-1 text-xs font-semibold text-white no-underline hover:bg-yellow-600"
								>
									AMOUNT
								</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
		{#if error}
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
</style>
