<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let table = $state(data.data);

	console.log(data.data);
	let keys = [3, 7, 2, 8, 9, 10];
</script>

<div id="printarea" class="flex flex-col">
	<div class="grid-row-3 grid px-2">
		<div>
			<h1>SOA CLINIC</h1>
		</div>
		<div class="text-center">
			<h1 class="text-4xl">{data.clinicName}</h1>
		</div>
	</div>
	<table
		class=" dark:text-gray-40 mx-5 mt-2 w-[97%] text-left text-sm text-gray-500 rtl:text-right"
	>
		<thead class="bg-gray-50 text-xs text-gray-700 uppercase dark:bg-gray-700 dark:text-gray-400">
			<tr>
				{#each keys as key}
					<th class="px-6 py-3"
						>{Object.keys(table[0])
							[key].replace(/([A-Z])/g, ' $1')
							.trim()}</th
					>
				{/each}
				<th class="px-6 py-3"> PHOTO </th>
			</tr>
		</thead>
		<tbody>
			{#each table as row, index}
				<tr class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
					{#each keys as key}
						<td class="px-6 py-4">{row[Object.keys(table[0])[key]]}</td>
					{/each}
					<td class="px-6 py-4">
						<a aria-label="history" href={`/history/${row[Object.keys(table[0])[2]]}`}>
							LINK
						</a></td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	@media print {
		#printarea {
			display: block;
		}
	}
</style>
