<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let doctors = data.doctors;
	let clinics = data.clinics;

	let doctorsWithClinic = $derived(
		doctors.map((doctor) => ({
			name: doctor.label,
			clinicId: doctor.clinicId,
			clinicName:
				clinics.find((clinic) => clinic.clinicId === doctor.clinicId)?.label || 'Unknown Clinic'
		}))
	);

	let newDoctorName = $state('');
	let newClinicId: number | null = $state(null);
	let newClinicSearch = $state('');
	let filteredClinics: typeof clinics = $state([]);
	let isClinicInputFocused = $state(false); // Add a state to track focus

	$effect(() => {
		if (isClinicInputFocused && !newClinicSearch) {
			filteredClinics = clinics; // Show all clinics on focus if no search term
		} else if (newClinicSearch) {
			filteredClinics = clinics.filter((clinic) =>
				clinic.label.toLowerCase().includes(newClinicSearch.toLowerCase())
			);
		} else {
			filteredClinics = []; // Hide the dropdown by default
		}
	});

	function handleAddDoctor() {
		if (newDoctorName && newClinicId) {
			// In a real application, you would send this data to your backend
			console.log('Adding doctor:', newDoctorName, 'to clinic ID:', newClinicId);
			// Reset the form
			newDoctorName = '';
			newClinicId = null;
			newClinicSearch = '';
			isClinicInputFocused = false; // Reset focus state
		} else {
			alert('Please enter a doctor name and select a clinic.');
		}
	}

	function selectClinic(clinic: (typeof clinics)[0]) {
		newClinicId = clinic.clinicId;
		newClinicSearch = clinic.label;
		filteredClinics = []; // Hide the dropdown after selection
		isClinicInputFocused = false; // Reset focus state
	}

	function handleClinicInputFocus() {
		isClinicInputFocused = true;
	}

	function handleClinicInputBlur() {
		// Add a small delay to allow click on dropdown items
		setTimeout(() => {
			isClinicInputFocused = false;
		}, 100);
	}
</script>

<div>
	<div class="flex flex-col items-center justify-center overflow-x-auto">
		<table class="mt-10 w-lg divide-y divide-gray-200 rounded-md shadow-md">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Doctor
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Clinic
					</th>
					<th scope="col" class="relative px-6 py-3">
						<span class="sr-only">Edit</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each doctorsWithClinic as doctor}
					<tr>
						<td class="px-6 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
							{doctor.name}
						</td>
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">{doctor.clinicName}</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							<button
								type="button"
								class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
							>
								Edit
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<form method="POST" class="mt-8 w-lg space-y-4">
			<div>
				<label for="newClinicSearch" class="block text-sm font-medium text-gray-700">
					Clinic
				</label>
				<div class="relative mt-1">
					<input
						type="text"
						id="newClinicSearch"
						bind:value={newClinicSearch}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Search for a clinic"
						onfocus={handleClinicInputFocus}
						onblur={handleClinicInputBlur}
						required
					/>
					{#if (isClinicInputFocused || newClinicSearch) && filteredClinics.length > 0}
						<ul
							class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow-lg"
						>
							{#each filteredClinics as clinic}
								<li
									class="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
									onclick={() => selectClinic(clinic)}
								>
									{clinic.label}
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				{#if newClinicId}
					<p class="mt-1 text-sm text-gray-500">
						Selected Clinic: {clinics.find((c) => c.clinicId === newClinicId)?.label}
					</p>
				{/if}
			</div>
			<div>
				<label for="newDoctorName" class="block text-sm font-medium text-gray-700">
					Doctor Name
				</label>
				<div class="mt-1">
					<input
						type="text"
						id="newDoctorName"
						bind:value={newDoctorName}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Enter doctor's name"
						required
					/>
				</div>
			</div>
			<div>
				<button
					type="button"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					onclick={handleAddDoctor}
				>
					Add Doctor
				</button>
			</div>
		</form>
	</div>
</div>
