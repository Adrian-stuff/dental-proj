<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let table = $state(data.data);
	let error = $state(false);
	if (form?.success) {
		table = form.data;
		if (form.data.length === 0) {
			error = true;
		}
	}

	let selectedClinic = $state(data.clinics[0].value);
	let startDate: string | null = $state(form != undefined && form.success ? form.start_date : null);
	let endDate: string | null = $state(form != undefined && form.success ? form.end_date : null);

	let keys = [3, 5, 9, 2, 10, 11, 12];
</script>

<div class="flex flex-col">
	<div class="m-2 flex flex-wrap items-center gap-4 print:hidden">
		<form method="POST" action="?/clinics" class="flex items-center gap-2">
			<label for="clinic_name" class="flex flex-col items-start gap-1">
				<h1>Clinic</h1>
				<select name="clinic_name" bind:value={selectedClinic} class="rounded border p-2">
					{#each data?.clinics as clinic}
						<option value={clinic.value}>{clinic.label}</option>
					{/each}
				</select>
			</label>
			<button
				class="self-end rounded border p-2 hover:cursor-pointer hover:bg-blue-300"
				type="submit"
			>
				QUERY
			</button>
		</form>
		<form method="POST" action="?/caseNo" class="flex items-center gap-2">
			<label for="case_no" class="flex flex-col items-start gap-1">
				<h1>Case No</h1>
				<input type="text" name="case_no" placeholder="Enter Case No" class="rounded border p-2" />
			</label>
			<button
				class="self-end rounded border p-2 hover:cursor-pointer hover:bg-blue-300"
				type="submit"
			>
				QUERY
			</button>
		</form>
		<form method="POST" action="?/date" class="flex items-center gap-2">
			<label for="start_date" class="flex flex-col items-start gap-1">
				<h1>Start Date</h1>
				<input type="date" name="start_date" bind:value={startDate} class="rounded border p-2" />
			</label>
			<label for="end_date" class="flex flex-col items-start gap-1">
				<h1>End Date</h1>
				<input type="date" name="end_date" bind:value={endDate} class="rounded border p-2" />
			</label>
			<button
				class="self-end rounded border p-2 hover:cursor-pointer hover:bg-green-300"
				type="submit"
			>
				FILTER BY DATE
			</button>
		</form>
		<a
			class="absolute top-7 right-5 rounded border p-2 hover:cursor-pointer hover:bg-blue-300"
			href="/upload_record">ADD RECORD</a
		>
	</div>

	<div id="printarea" class="flex flex-col">
		{#if form?.success}
			<div class="grid-row-3 grid px-2">
				<div>
					<h1>SOA CLINIC</h1>
				</div>
				<div class="text-center">
					<h1 class="text-4xl">{form.clinicName}</h1>
				</div>
			</div>
		{/if}
		{#if !error}
			<table
				class="mx-5 mt-2 w-[97%] border-collapse text-left text-sm text-gray-500 rtl:text-right"
			>
				<thead class="bg-gray-700 text-center text-xs text-gray-700 uppercase">
					<tr>
						{#each keys as key}
							<th class="border border-gray-600 px-6 py-3 font-semibold text-gray-400">
								{Object.keys(table[0])
									[key].replace(/([A-Z])/g, ' $1')
									.trim()}
							</th>
						{/each}
						<th class="border border-gray-600 px-6 py-3 font-semibold text-gray-400 print:hidden">
							HISTORY
						</th>
						<th class="border border-gray-600 px-6 py-3 font-semibold text-gray-400 print:hidden">
							ACTIONS
						</th>
					</tr>
				</thead>
				<tbody class="dark:bg-gray-900">
					{#each table as row, index}
						<tr class={`border-gray-700 ${+row.excessPayment >= 0 ? 'bg-blue-200' : 'bg-red-300'}`}>
							{#each keys as key}
								<td class="border border-gray-600 px-6 py-4 text-black">
									{#if key === 11 || key === 12}
										<span>&#8369;</span>
									{/if}
									{row[Object.keys(table[0])[key]]}
								</td>
							{/each}
							<td class="border border-gray-600 px-6 py-4 print:hidden">
								<a
									aria-label="history"
									href={`/history/${row[Object.keys(table[0])[2]]}`}
									class=" no-underline"
								>
									LINK
								</a>
							</td>
							<td class="border border-gray-600 px-6 py-4 text-center print:hidden">
								<a
									aria-label="in"
									href={`/IN/${row[Object.keys(table[0])[2]]}`}
									class="mr-4 border bg-blue-400 p-1 no-underline"
								>
									IN
								</a>
								<a
									aria-label="out"
									href={`/OUT/${row[Object.keys(table[0])[2]]}`}
									class="border bg-orange-300 p-1 no-underline"
								>
									OUT
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
