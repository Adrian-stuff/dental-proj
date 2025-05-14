<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();

	let { record } = data;

	// State management for dropdowns
	let allDoctors = $state(data?.doctors);
	let allClinics = $state(data?.clinics);
	let filteredDoctors = $state<{ value: string; label: string; clinicId: number }[]>(allDoctors);
	let filteredClinics = $state<{ value: string; label: string; clinicId: number }[]>(allClinics);

	let selectedDoctor: { value: string; label: string; clinicId: number } | null = $state(null);
	let selectedClinic: { value: string; label: string; clinicId: number } | null = $state(null);

	let doctorInputValue = $state(record.doctorName);
	let clinicInputValue = $state(record.clinicName);
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);

	// Initialize selected values
	onMount(() => {
		// Set initial clinic
		const initialClinic = allClinics.find((c) => c.value === record.clinicName);
		if (initialClinic) {
			selectClinic(initialClinic);
		}

		// Set initial doctor
		const initialDoctor = allDoctors.find((d) => d.value === record.doctorName);
		if (initialDoctor) {
			selectDoctor(initialDoctor);
		}
	});

	function filterDoctors() {
		filteredDoctors = allDoctors.filter((doctor) =>
			doctor.label.toLowerCase().includes(doctorInputValue.toLowerCase())
		);
		showDoctorDropdown = doctorInputValue.length > 0 && filteredDoctors.length > 0;
	}

	function selectDoctor(doctor: { value: string; label: string; clinicId: number }) {
		selectedDoctor = doctor;
		doctorInputValue = doctor.label;
		showDoctorDropdown = false;
	}

	function filterClinics() {
		filteredClinics = allClinics.filter((clinic) =>
			clinic.label.toLowerCase().includes(clinicInputValue.toLowerCase())
		);
		showClinicDropdown = clinicInputValue.length > 0 && filteredClinics.length > 0;
		// Reset doctor selection when clinic input changes
		selectedDoctor = null;
		doctorInputValue = '';
		filteredDoctors = [];
	}

	function selectClinic(clinic: { value: string; label: string; clinicId: number }) {
		selectedClinic = clinic;
		clinicInputValue = clinic.label;
		showClinicDropdown = false;
		// Filter doctors based on selected clinic
		filteredDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
	}

	// Handle successful form submission
	function handleSubmitSuccess() {
		if (form?.success) {
			setTimeout(() => {
				goto('/');
			}, 500);
		}
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Edit Record #{record.caseNo}</h1>
		<a
			href="/"
			class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
		>
			Back to List
		</a>
	</div>

	{#if form?.message}
		<div
			class="mb-4 rounded-md p-4 {form.success
				? 'bg-green-50 text-green-700'
				: 'bg-red-50 text-red-700'}"
		>
			{form.message}
		</div>
	{/if}

	<form method="POST" action="?/update" class="space-y-6 rounded-lg bg-white p-6 shadow-lg">
		<input type="hidden" name="recordId" value={record.recordId} />

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Case Type -->
			<div>
				<label for="case_type" class="mb-2 block text-sm font-bold text-gray-700">
					Case Type
					<select
						name="caseType"
						value={record.caseType}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					>
						{#each data?.caseTypes as caseType}
							<option value={caseType.caseType}>{caseType.caseType}</option>
						{/each}
					</select>
				</label>
			</div>

			<!-- Clinic Name with Dropdown -->
			<div class="relative">
				<label for="clinic_name" class="mb-2 block text-sm font-bold text-gray-700">
					Clinic
					<input
						type="text"
						id="clinic_name"
						autocomplete="off"
						bind:value={clinicInputValue}
						oninput={filterClinics}
						onfocus={() => {
							showClinicDropdown = true;
						}}
						onblur={() => setTimeout(() => (showClinicDropdown = false), 200)}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						placeholder="Clinic name"
					/>
				</label>
				{#if showClinicDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black"
					>
						{#each filteredClinics as clinic}
							<li
								class="cursor-pointer px-4 py-2 hover:bg-indigo-600 hover:text-white"
								onmousedown={() => selectClinic(clinic)}
							>
								{clinic.label}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="clinicName" value={selectedClinic?.value} />
			</div>

			<!-- Doctor Name with Dropdown -->
			<div class="relative">
				<label for="doctor_name" class="mb-2 block text-sm font-bold text-gray-700">
					Doctor
					<input
						type="text"
						id="doctor_name"
						autocomplete="off"
						bind:value={doctorInputValue}
						oninput={filterDoctors}
						onfocus={() => (showDoctorDropdown = selectedClinic != null)}
						onblur={() => setTimeout(() => (showDoctorDropdown = false), 200)}
						required
						disabled={!selectedClinic}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
						placeholder="Doctor name"
					/>
				</label>
				{#if showDoctorDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black"
					>
						{#each filteredDoctors as doctor}
							<li
								class="cursor-pointer px-4 py-2 hover:bg-indigo-600 hover:text-white"
								onmousedown={() => selectDoctor(doctor)}
							>
								{doctor.label}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="doctorName" value={selectedDoctor?.value} />
			</div>

			<!-- Total Amount -->
			<div>
				<label for="totalAmount" class="block text-sm font-medium text-gray-700">Total Amount</label
				>
				<input
					type="number"
					id="totalAmount"
					name="totalAmount"
					value={record.totalAmount}
					step="0.01"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>

			<!-- Paid Amount -->
			<div>
				<label for="paidAmount" class="block text-sm font-medium text-gray-700">Paid Amount</label>
				<input
					type="number"
					id="paidAmount"
					name="paidAmount"
					value={record.paidAmount}
					step="0.01"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>

			<!-- Payment Method -->
			<div>
				<label for="paymentMethod" class="block text-sm font-medium text-gray-700"
					>Payment Method</label
				>
				<select
					id="paymentMethod"
					name="paymentMethod"
					value={record.paymentMethod}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				>
					<option value="cash">Cash</option>
					<option value="gcash">GCash</option>
					<option value="bank">Bank Transfer</option>
					<option value="others">Others</option>
				</select>
			</div>
		</div>

		<!-- Description -->
		<div>
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				>{record.description}</textarea
			>
		</div>

		<!-- Remarks -->
		<div>
			<label for="remarks" class="block text-sm font-medium text-gray-700">Remarks</label>
			<textarea
				id="remarks"
				name="remarks"
				rows="2"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				>{record.remarks}</textarea
			>
		</div>

		<!-- Submit Button -->
		<div class="flex justify-end">
			<button
				type="submit"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
			>
				Update Record
			</button>
		</div>
	</form>
</div>
