<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let in_file: HTMLInputElement | undefined = $state();
	let in_img: HTMLImageElement | undefined = $state();
	let show_in: boolean = $state(false);
	function handleInImageChange() {
		const file = in_file.files[0];

		if (file) {
			show_in = true;

			const reader = new FileReader();
			reader.addEventListener('load', function () {
				in_img.setAttribute('src', reader.result.toString());
			});
			reader.readAsDataURL(file);

			return;
		}
		show_in = false;
	}

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});
</script>

<div class="bg-white-100 flex flex-col items-center justify-center rounded-md p-8">
	<h1 class="mb-4 text-2xl font-semibold">OUT Case No: {data.caseNo}</h1>

	<form
		method="POST"
		enctype="multipart/form-data"
		class="flex w-full max-w-md flex-row items-start justify-center space-x-6 rounded border border-gray-300 bg-red-100 px-8 py-6"
	>
		<input type="text" name="case_no" value={data.caseNo} hidden />
		<label for="in-img" class="flex flex-col gap-3">
			<div>
				<!-- <h2 class="text-center text-lg font-medium text-gray-700">IN Details</h2> -->
				<label for="date" class="mt-2 block text-sm font-medium text-gray-600">
					OUT Date
					<input
						class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						type="date"
						name="date"
						placeholder="Date"
						required
						bind:value={date}
					/>
				</label>
				<label for="time" class="mt-2 block text-sm font-medium text-gray-600">
					OUT Time
					<input
						class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						type="time"
						name="time"
						placeholder="Time"
						required
						bind:value={time}
					/>
				</label>
			</div>
			<div>
				<h2 class="text-lg font-medium text-gray-700">OUT Image</h2>
				<input
					class="mt-1 w-full rounded-md border-2 border-dashed border-gray-400 px-2 py-3 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					type="file"
					name="out-img"
					accept="image/*"
					bind:this={in_file}
					onchange={handleInImageChange}
					required
				/>
				{#if show_in}
					<div class="mt-2 flex justify-center">
						<img class="h-auto w-70 rounded-md object-cover" bind:this={in_img} alt="OUT Preview" />
					</div>
				{/if}
				<div class="mt-4 flex justify-center">
					<button
						class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
						type="submit">Add OUT</button
					>
				</div>
			</div>
		</label>
	</form>
</div>
