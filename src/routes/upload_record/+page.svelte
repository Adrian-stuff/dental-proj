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

<div class="mt-5 flex justify-center">
	{#if form?.success}
		<p>success</p>
	{:else if form?.error}
		<p>error {form?.error}</p>
	{/if}

	<form
		class="flex flex-col items-center justify-center gap-5"
		method="POST"
		enctype="multipart/form-data"
	>
		<div class="flex flex-row gap-10">
			<div class="gap- flex flex-col gap-2">
				<label for="case_type">
					<h1>Case type</h1>
					<select name="case_type" bind:value={case_type} required>
						{#each data?.caseTypes as caseType}
							<option value={caseType.value}>{caseType.label}</option>
						{/each}
					</select>
					<!-- <input type="text" name="case_type" value={case_type} hidden /> -->
				</label>
				<label for="case_number" class="">
					<h1>Case number</h1>
					<input
						type="text"
						name="case_number"
						class="w-20 border-2 border-dashed"
						placeholder="Case number"
						value={data.caseNo}
						disabled
					/>
				</label>
			</div>
			<div class="flex flex-col gap-2">
				<label for="doctor_name">
					<h1>Doctor</h1>
					<select name="doctor_name" required>
						{#each data?.doctors as doctor}
							<option value={doctor.value}>{doctor.label}</option>
						{/each}
					</select>
				</label>
				<label for="clinic_name">
					<h1>Clinic</h1>
					<select name="clinic_name" required>
						{#each data?.clinics as clinic}
							<option value={clinic.value}>{clinic.label}</option>
						{/each}
					</select>
				</label>
			</div>
			<div class="flex flex-col gap-2">
				<label for="patient_name">
					<h1>Patient Name</h1>
					<input type="text" name="patient_name" placeholder="Patient name" required />
				</label>
				<label for="description">
					<h1>Description</h1>
					<textarea class="h-20" name="description" placeholder="Description" required> </textarea>
				</label>
			</div>
		</div>
		<div class="flex flex-row justify-between gap-10">
			<div class="flex flex-row items-center justify-between border px-10 py-5">
				<label for="in-img">
					<h1>IN</h1>
					<input
						class="w-30 border-2 px-2"
						type="file"
						name="in-img"
						accept="image/*"
						bind:this={in_file}
						onchange={handleInImageChange}
						required
					/>
					{#if show_in}
						<img class="h-40 w-40" bind:this={in_img} alt="IN Preview" />
					{/if}
					<div class="flex flex-col gap-2">
						<label for="date">
							<h1>IN Date</h1>
							<input type="date" name="date" placeholder="Date" required bind:value={date} />
						</label>
						<label for="time">
							<h1>IN Time</h1>
							<input type="time" name="time" placeholder="Time" required bind:value={time} />
						</label>
					</div>
				</label>
				<!-- <label for="out-img">
					<h1>OUT</h1>
					<input
						class="w-30 border-2 px-2"
						type="file"
						name="out-img"
						accept="image/*"
						bind:this={out_file}
						onchange={handleOutImageChange}
						required
					/>
					{#if show_out}
						<img class="h-40 w-40" bind:this={out_img} alt="OUT Preview" />
					{/if}
					<div class="flex flex-col gap-2">
						<label for="date">
							<h1>OUT Date</h1>
							<input type="date" name="date" placeholder="Date" required bind:value={date} />
						</label>
						<label for="time">
							<h1>OUT Time</h1>
							<input type="time" name="time" placeholder="Time" required bind:value={time} />
						</label>
					</div>
				</label> -->
			</div>
			<div class="flex gap-10">
				<div class="flex flex-col gap-2">
					<label for="total_amount">
						<h1>Total amount</h1>
						<input
							type="number"
							bind:value={total_amount}
							name="total_amount"
							placeholder="Total amount"
							accept="number"
							required
						/>
					</label>
					<label for="paid_amount">
						<h1>Paid amount</h1>
						<input
							type="number"
							bind:value={paid_amount}
							name="paid_amount"
							placeholder="Paid amount"
							required
						/>
					</label>
					<label for="excess_payment">
						<h1>Excess amount</h1>
						<input
							type="text"
							value={paid_amount && total_amount ? paid_amount - total_amount : 0}
							name="excess_payment"
							placeholder="Remaining amount"
							disabled
						/>
						<input
							type="text"
							value={paid_amount && total_amount ? paid_amount - total_amount : 0}
							name="excess_payment"
							placeholder="Remaining amount"
							hidden
						/>
					</label>
				</div>
			</div>
		</div>
		<div class="align-center mt-2 flex justify-center">
			<button class="rounded-md border-1 p-2 hover:cursor-pointer hover:bg-blue-500" type="submit"
				>Add record</button
			>
		</div>
	</form>
</div>
