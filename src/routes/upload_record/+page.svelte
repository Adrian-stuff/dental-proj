<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let total_amount: number | undefined = $state();
	let paid_amount: number | undefined = $state();
	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let case_type: string = $state('OR');
	let in_file: HTMLInputElement | undefined = $state();
	let out_file: HTMLInputElement | undefined = $state();
	let in_img: HTMLImageElement | undefined = $state();
	let out_img: HTMLImageElement | undefined = $state();
	let show_in: boolean = $state(false);
	let show_out: boolean = $state(false);
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

	function handleOutImageChange() {
		const file = out_file.files[0];

		if (file) {
			show_out = true;
			const reader = new FileReader();
			reader.addEventListener('load', function () {
				out_img.setAttribute('src', reader.result.toString());
			});
			reader.readAsDataURL(file);

			return;
		}
		show_out = false;
	}

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	console.log('doctors', data?.doctors);
	console.log('clinics', data?.clinics);
</script>

<div class="mt-8 flex justify-center">
	{#if form?.success}
		<p class="font-semibold text-green-500">Success!</p>
	{:else if form?.error}
		<p class="text-red-500">Error: {form?.error}</p>
	{/if}

	<form
		class="mb-4 flex w-full max-w-lg flex-col gap-6 rounded-md bg-white px-8 pb-8 shadow-md"
		method="POST"
		enctype="multipart/form-data"
	>
		<!-- <h2 class="mb-4 text-xl font-semibold text-gray-700">Add New Record</h2> -->
		<div class="flex flex-row gap-8">
			<div class="flex w-1/2 flex-col gap-4">
				<label for="case_type" class="mb-2 block text-sm font-bold text-gray-700">
					Case type
					<select
						name="case_type"
						bind:value={case_type}
						required
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					>
						{#each data?.caseTypes as caseType}
							<option value={caseType.value}>{caseType.label}</option>
						{/each}
					</select>
				</label>
				<label for="case_number" class="mb-2 block text-sm font-bold text-gray-700">
					Case number
					<input
						type="text"
						name="case_number"
						class="focus:shadow-outline w-full cursor-not-allowed appearance-none rounded border border-dashed bg-gray-100 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						placeholder="Case number"
						value={data.caseNo}
						disabled
					/>
				</label>
			</div>
			<div class="flex w-1/2 flex-col gap-4">
				<label for="doctor_name" class="mb-2 block text-sm font-bold text-gray-700">
					Doctor
					<select
						name="doctor_name"
						required
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					>
						{#each data?.doctors as doctor}
							<option value={doctor.value}>{doctor.label}</option>
						{/each}
					</select>
				</label>
				<label for="clinic_name" class="mb-2 block text-sm font-bold text-gray-700">
					Clinic
					<select
						name="clinic_name"
						required
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					>
						{#each data?.clinics as clinic}
							<option value={clinic.value}>{clinic.label}</option>
						{/each}
					</select>
				</label>
			</div>
		</div>
		<div class="flex flex-col gap-4">
			<label for="patient_name" class="mb-2 block text-sm font-bold text-gray-700">
				Patient Name
				<input
					type="text"
					name="patient_name"
					placeholder="Patient name"
					required
					class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
				/>
			</label>
			<label for="description" class="mb-2 block text-sm font-bold text-gray-700">
				Description
				<textarea
					class="focus:shadow-outline h-24 w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					name="description"
					placeholder="Description"
					required
				></textarea>
			</label>
		</div>
		<div class="flex flex-row justify-between gap-8">
			<div class="flex w-1/2 flex-col rounded-md border p-6">
				<label for="in-img" class="mb-2 block text-sm font-bold text-gray-700">
					IN Image
					<input
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						type="file"
						name="in-img"
						accept="image/*"
						bind:this={in_file}
						onchange={handleInImageChange}
						required
					/>
				</label>
				{#if show_in}
					<div class="mt-2">
						<img
							class="h-40 w-40 rounded-md object-cover shadow-sm"
							bind:this={in_img}
							alt="IN Preview"
						/>
					</div>
				{/if}
				<div class="mt-4 flex flex-col gap-2">
					<label for="date" class="mb-2 block text-sm font-bold text-gray-700">
						IN Date
						<input
							type="date"
							name="date"
							placeholder="Date"
							required
							bind:value={date}
							class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						/>
					</label>
					<label for="time" class="mb-2 block text-sm font-bold text-gray-700">
						IN Time
						<input
							type="time"
							name="time"
							placeholder="Time"
							required
							bind:value={time}
							class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						/>
					</label>
				</div>
			</div>
			<div class="flex w-1/2 flex-col gap-4">
				<label for="total_amount" class="mb-2 block text-sm font-bold text-gray-700">
					Total amount
					<input
						type="number"
						bind:value={total_amount}
						name="total_amount"
						placeholder="Total amount"
						accept="number"
						required
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					/>
				</label>
				<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
					Paid amount
					<input
						type="number"
						bind:value={paid_amount}
						name="paid_amount"
						placeholder="Paid amount"
						required
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					/>
				</label>
				<label for="excess_payment" class="mb-2 block text-sm font-bold text-gray-700">
					Excess amount
					<input
						type="text"
						value={paid_amount && total_amount ? paid_amount - total_amount : 0}
						name="excess_payment"
						placeholder="Excess amount"
						disabled
						class="focus:shadow-outline w-full cursor-not-allowed appearance-none rounded border bg-gray-100 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
					/>
					<input
						type="hidden"
						value={paid_amount && total_amount ? paid_amount - total_amount : 0}
						name="excess_payment"
					/>
				</label>
			</div>
		</div>
		<div class="flex items-center justify-center">
			<button
				class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
				type="submit">Add Record</button
			>
		</div>
	</form>
</div>
