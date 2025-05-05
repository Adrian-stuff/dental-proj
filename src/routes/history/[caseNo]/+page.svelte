<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let historyItems: any[] = data.data;

	function bufferToImageUrlViaBlob(buffer: Buffer): string {
		const uint8Array = new Uint8Array(buffer);
		const blob = new Blob([uint8Array], { type: 'image/png' });
		return URL.createObjectURL(blob);
	}

	function formatTimeToStandard(timeWithOffset: string): string {
		const [timePart, offsetPart] = timeWithOffset.split('+');
		const [hours, minutes, seconds] = timePart.split(':').map(Number);
		const offsetHours = parseInt(offsetPart.substring(0, 2), 10);

		let utcHours = hours - offsetHours;
		if (utcHours < 0) {
			utcHours += 24;
		}

		let localHours = utcHours + 8;
		if (localHours >= 24) {
			localHours -= 24;
		}

		const period = localHours >= 12 ? 'PM' : 'AM';
		const standardHours = localHours % 12 === 0 ? 12 : localHours % 12;

		const formattedTime = `${standardHours}:${String(minutes).padStart(2, '0')}:${String(
			seconds
		).padStart(2, '0')} ${period}`;
		return formattedTime;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		return date.toLocaleDateString('en-US', options);
	}

	onMount(() => {
		console.log(data.recordData);
		return () => {
			historyItems.forEach((item) => {
				if (item.imageData) {
					const imageUrl = bufferToImageUrlViaBlob(item.imageData);
					URL.revokeObjectURL(imageUrl);
				}
			});
		};
	});
</script>

<div class="min-h-screen bg-gray-100 p-6">
	<div class="mb-6 rounded-md bg-white p-6 shadow-md">
		<div class="mb-4 flex flex-col items-center justify-between sm:flex-row">
			<h1 class="text-xl font-semibold text-gray-800">
				CASE NUMBER: <span class="font-bold text-indigo-600">{data.caseNo}</span>
			</h1>
			<h2 class="text-lg text-gray-700">
				CLINIC: <span class="font-medium text-green-600">{data.recordData[0].clinicName}</span>
			</h2>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each historyItems as item}
			<div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<div class="mb-3 flex items-center justify-between">
					<span class="text-sm text-gray-500"
						>{formatDate(item.historyDate)} {formatTimeToStandard(item.historyTime)}</span
					>
					<span
						class={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
							item.historyType === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
						}`}>{item.historyType}</span
					>
				</div>
				<p class="mb-2 text-gray-700">
					<span class="font-semibold">Time:</span>
					<span class="text-blue-500">{formatTimeToStandard(item.historyTime)}</span>
				</p>
				{#if item.imageData}
					<div
						class="mt-2 overflow-hidden rounded-md border border-gray-300 transition-shadow duration-200 hover:shadow-md"
					>
						<img
							src={bufferToImageUrlViaBlob(item.imageData)}
							alt="History"
							class="block aspect-square h-auto w-full object-cover"
						/>
					</div>
				{:else}
					<p class="mt-2 text-gray-500 italic">No Image Available</p>
				{/if}
				<!-- <p class="mt-3 text-sm text-gray-600">
					CASE NO: <span class="font-medium">{item.recordId}</span>
				</p> -->
			</div>
		{/each}
	</div>
</div>
