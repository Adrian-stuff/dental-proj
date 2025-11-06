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
	// Simplify state management - remove dropdown visibility states
	let selectedDoctor = $state(data.record.doctorId);
	let selectedClinic = $state(data.record.clinicId);
	let availableDoctors = $state(allDoctors.filter((d) => d.clinicId === record.clinicId));
	let filteredDoctors = $state(availableDoctors);

	// Additional state for searchable dropdowns
	let doctorInputValue = $state(record.doctorName);
	let clinicInputValue = $state(record.clinicName);
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let filteredClinics = $state(allClinics);

	// Initialize with current values
	onMount(() => {
		// Set initial clinic
		const clinic = allClinics.find((c) => c.clinicId === record.clinicId);
		if (clinic) {
			clinicInputValue = clinic.clinicName;
			selectedClinic = clinic.clinicId;

			// Filter doctors for this clinic
			availableDoctors = allDoctors.filter((d) => d.clinicId === clinic.clinicId);
			filteredDoctors = availableDoctors;

			// Set initial doctor
			const doctor = availableDoctors.find((d) => d.doctorId === record.doctorId);
			if (doctor) {
				doctorInputValue = doctor.doctorName;
				selectedDoctor = doctor.doctorId;
			}
		}
	});

	function filterDoctors() {
		filteredDoctors = availableDoctors.filter((doctor) =>
			doctor.doctorName.toLowerCase().includes(doctorInputValue.toLowerCase())
		);
		showDoctorDropdown = doctorInputValue.length > 0 && filteredDoctors.length > 0;
	}

	function selectDoctor(doctor: (typeof allDoctors)[0]) {
		selectedDoctor = doctor.doctorId;
		doctorInputValue = doctor.doctorName;
		showDoctorDropdown = false;
	}

	function filterClinics() {
		filteredClinics = allClinics.filter((clinic) =>
			clinic.clinicName.toLowerCase().includes(clinicInputValue.toLowerCase())
		);
		showClinicDropdown = clinicInputValue.length > 0 && filteredClinics.length > 0;
		selectedDoctor = null;
		doctorInputValue = '';
	}

	function selectClinic(clinic: (typeof allClinics)[0]) {
		selectedClinic = clinic.clinicId;
		clinicInputValue = clinic.clinicName;
		showClinicDropdown = false;

		// Reset doctor selection first
		selectedDoctor = null;
		doctorInputValue = '';

		// Update available doctors for this clinic
		availableDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
		filteredDoctors = availableDoctors;

		// Auto-select if only one doctor
		if (availableDoctors.length === 1) {
			const doctor = availableDoctors[0];
			selectedDoctor = doctor.doctorId;
			doctorInputValue = doctor.doctorName;
		}
	}
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Edit Record #{record.recordId}</h1>
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

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'success') {
					goto('/', { replaceState: true });
				}
			};
		}}
		class="space-y-6 rounded-lg bg-white p-6 shadow-lg"
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		<div class="grid gap-6 md:grid-cols-2">
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
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Clinic name"
					/>
				</label>
				{#if showClinicDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
					>
						{#each filteredClinics as clinic}
							<li
								class="relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white"
								onclick={() => selectClinic(clinic)}
							>
								<span class="block truncate">{clinic.clinicName}</span>
								{#if selectedClinic === clinic.clinicId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600"
										>✓</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="clinicId" value={selectedClinic} />
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
						class="block w-full appearance-none rounded-md border {selectedClinic
							? 'border-gray-300'
							: 'cursor-not-allowed border-dashed border-gray-300 bg-gray-100'} px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder={selectedClinic ? 'Doctor name' : 'Select a clinic first'}
					/>
				</label>
				{#if showDoctorDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
					>
						{#each filteredDoctors as doctor}
							<li
								class="relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white"
								onclick={() => selectDoctor(doctor)}
							>
								<span class="block truncate">{doctor.doctorName}</span>
								{#if selectedDoctor === doctor.doctorId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600"
										>✓</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="doctorId" value={selectedDoctor} />
			</div>

			<!-- Patient Name -->
			<div>
				<label for="patient_name" class="mb-2 block text-sm font-bold text-gray-700">
					Patient Name
					<input
						type="text"
						id="patient_name"
						name="patientName"
						value={record.patientName}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						placeholder="Patient name"
					/>
				</label>
			</div>

			<!-- Remarks -->
			<div>
				<label for="remarks" class="block text-sm font-medium text-gray-700">Remarks</label>
				<select
					id="remarks"
					name="remarks"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={record.remarks || 'pending'}
				>
					<option value="pending">Pending</option>
					<option value="finished">Finished</option>
				</select>
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
		</div>
	</form>
</div>
