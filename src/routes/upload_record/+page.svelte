<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let allDoctors = $state(data?.doctors);
	let allClinics = $state(data?.clinics);
	let filteredDoctors = $state(allDoctors);
	let filteredClinics = $state(allClinics);

	let selectedDoctor: {
		doctorId: number;
		doctorName: string;
		clinicId: number;
	} | null = $state(null);
	let selectedClinic: {
		clinicId: number;
		clinicName: string;
	} | null = $state(null);

	let total_amount: number | undefined = $state();
	let paid_amount: number | undefined = $state();
	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let case_type_upper: number = $state(1);
	let case_type_lower: number = $state(1);
	let in_file: HTMLInputElement | undefined = $state();
	let out_file: HTMLInputElement | undefined = $state();
	let in_img: HTMLImageElement | undefined = $state();
	let out_img: HTMLImageElement | undefined = $state();
	let show_in: boolean = $state(false);
	let show_out: boolean = $state(false);

	let doctorInputValue = $state(null);
	let clinicInputValue = $state(null);
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let payment_method = $state('cash');
	function handleInImageChange() {
		const file = in_file?.files?.[0];

		if (file) {
			show_in = true;

			const reader = new FileReader();
			reader.addEventListener('load', function () {
				in_img?.setAttribute('src', reader.result?.toString() || '');
			});
			reader.readAsDataURL(file);

			return;
		}
		show_in = false;
	}

	function filterDoctors() {
		filteredDoctors = allDoctors.filter((doctor) =>
			doctor.doctorName.toLowerCase().includes(doctorInputValue.toLowerCase())
		);
		showDoctorDropdown = doctorInputValue.length > 0 && filteredDoctors.length > 0;
	}

	function selectDoctor(doctor: { doctorId: number; doctorName: string; clinicId: number }) {
		selectedDoctor = doctor;
		doctorInputValue = doctor.doctorName;
		showDoctorDropdown = false;
	}

	function filterClinics() {
		filteredClinics = allClinics.filter((clinic) =>
			clinic.clinicName.toLowerCase().includes(clinicInputValue.toLowerCase())
		);
		showClinicDropdown = clinicInputValue.length > 0 && filteredClinics.length > 0;
		// Reset doctor selection when clinic input changes
		selectedDoctor = null;
		doctorInputValue = '';
		filteredDoctors = [];
	}

	function selectClinic(clinic: { clinicId: number; clinicName: string }) {
		selectedClinic = clinic;
		clinicInputValue = clinic.clinicName;
		showClinicDropdown = false;
		// Filter doctors based on the selected clinic
		filteredDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
		// If a doctor was previously selected and is not in the new clinic, reset
		if (selectedDoctor && selectedDoctor.clinicId !== clinic.clinicId) {
			selectedDoctor = null;
			doctorInputValue = '';
		} else if (filteredDoctors.length === 1) {
			// Automatically select the doctor if only one is available in the clinic
			selectedDoctor = filteredDoctors[0];
			doctorInputValue = filteredDoctors[0].doctorName;
		}
	}

	// Add these new state variables
	let showCameraModal = $state(false);
	let stream: MediaStream | null = $state(null);
	let videoElement: HTMLVideoElement = $state();
	let canvasElement: HTMLCanvasElement = $state();
	let showSettingsModal = $state(false);

	// Add jaw selection state
	let selected_jaw = $state('upper');

	// Function to handle camera operations
	async function startCamera() {
		try {
			// First check if we have permissions
			const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });

			if (permissions.state === 'denied') {
				showSettingsModal = true;
				throw new Error('Camera permission was denied');
			}

			// Request camera access
			stream = await navigator.mediaDevices.getUserMedia({
				video: {
					facingMode: 'environment',
					width: { ideal: 1280 },
					height: { ideal: 720 }
				},
				audio: false
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				// Wait for video to be ready
				await new Promise((resolve) => {
					videoElement.onloadedmetadata = () => {
						resolve(true);
					};
				});
				videoElement.play();
			}
		} catch (err) {
			console.error('Error accessing camera:', err);
			showSettingsModal = true;
			closeCameraModal();
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
	}

	function captureImage() {
		if (videoElement && canvasElement) {
			const context = canvasElement.getContext('2d');
			if (context) {
				canvasElement.width = videoElement.videoWidth;
				canvasElement.height = videoElement.videoHeight;
				context.drawImage(videoElement, 0, 0);

				// Convert canvas to file
				canvasElement.toBlob((blob) => {
					if (blob && in_file) {
						const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
						const dataTransfer = new DataTransfer();
						dataTransfer.items.add(file);
						in_file.files = dataTransfer.files;
						handleInImageChange();
					}
				}, 'image/jpeg');
			}
		}
		closeCameraModal();
	}

	function closeCameraModal() {
		showCameraModal = false;
		stopCamera();
	}

	function closeSettingsModal() {
		showSettingsModal = false;
	}

	// Add function to get next case number
	function getNextCaseNumber(caseTypeId: number) {
		const caseType = data?.caseTypes.find((ct) => ct.caseTypeId === caseTypeId);
		return caseType ? caseType.numberOfCases + 1 : 1;
	}

	// Add function to calculate case numbers based on jaw selection
	function calculateCaseNumbers() {
		const upperNumber = getNextCaseNumber(case_type_upper);
		let lowerNumber = getNextCaseNumber(case_type_lower);

		// If same case type is selected for both jaws and both are visible
		if (case_type_upper === case_type_lower && selected_jaw === 'U/L') {
			lowerNumber = upperNumber + 1;
		}

		return { upperNumber, lowerNumber };
	}

	$effect(() => {
		// Recalculate case numbers whenever case types or jaw selection changes
		const { upperNumber, lowerNumber } = calculateCaseNumbers();
		next_case_upper = upperNumber;
		next_case_lower = lowerNumber;
	});

	let next_case_upper = $state(1);
	let next_case_lower = $state(1);

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	onDestroy(() => {
		stopCamera();
	});

	console.log('doctors', data?.doctors);
	console.log('clinics', data?.clinics);
</script>

<div class=" flex justify-center px-4 md:px-8">
	<form
		class="mb-4 flex w-full flex-col gap-6 rounded-md bg-white p-6 shadow-md md:max-w-[1200px]"
		method="POST"
		enctype="multipart/form-data"
	>
		<h2 class="text-center text-2xl font-semibold text-gray-800">Add New Record</h2>

		<!-- First Row: Patient Information -->
		<div class="grid grid-cols-4 gap-4">
			<!-- Clinic Selection -->
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
						tabindex="-1"
						role="listbox"
						aria-labelledby="clinic_name"
					>
						{#each filteredClinics as clinic}
							<li
								class="relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white"
								id={`clinic-option-${clinic.clinicId}`}
								role="option"
								onclick={() => selectClinic(clinic)}
								onkeydown={(event) => {
									if (event.key === 'Enter') {
										selectClinic(clinic);
									}
								}}
							>
								<span class="block truncate">{clinic.clinicName}</span>
								{#if selectedClinic?.clinicId === clinic.clinicId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600">
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</span>
								{/if}
							</li>
						{/each}
						{#if filteredClinics.length === 0 && clinicInputValue.length > 0}
							<li class="relative cursor-default py-2 pr-9 pl-3 text-gray-500 select-none">
								No clinics found.
							</li>
						{/if}
					</ul>
				{/if}
				<input type="hidden" name="clinic_name" value={selectedClinic?.clinicId} />
			</div>

			<!-- Doctor Selection -->
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
						placeholder="Doctor name"
					/>
				</label>
				{#if showDoctorDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
						tabindex="-1"
						role="listbox"
						aria-labelledby="doctor_name"
					>
						{#each filteredDoctors as doctor}
							<li
								class="relative cursor-default py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-indigo-600 hover:text-white"
								id={`doctor-option-${doctor.doctorId}`}
								role="option"
								onclick={() => selectDoctor(doctor)}
								onkeydown={(event) => {
									if (event.key === 'Enter') {
										selectDoctor(doctor);
									}
								}}
							>
								<span class="block truncate">{doctor.doctorName}</span>
								{#if selectedDoctor?.doctorId === doctor.doctorId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600">
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</span>
								{/if}
							</li>
						{/each}
						{#if filteredDoctors.length === 0 && doctorInputValue.length > 0}
							<li class="relative cursor-default py-2 pr-9 pl-3 text-gray-500 select-none">
								No doctors found in this clinic.
							</li>
						{/if}
					</ul>
				{/if}
				<input type="hidden" name="doctor_name" value={selectedDoctor?.doctorId} />
			</div>

			<!-- Patient Name -->
			<div>
				<label for="patient_name" class="mb-2 block text-sm font-bold text-gray-700">
					Patient Name
					<input
						type="text"
						name="patient_name"
						placeholder="Patient name"
						autocomplete="off"
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</label>
			</div>
			<!-- Jaw Selection -->
			<div class="flex items-center justify-center">
				<div class="inline-flex rounded-md border border-gray-200" role="group">
					<button
						type="button"
						class="rounded-l-md px-2 py-3 text-xs font-medium {selected_jaw === 'upper'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'upper')}
					>
						Upper Only
					</button>
					<button
						type="button"
						class="border-r border-l px-2 text-xs font-medium {selected_jaw === 'U/L'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'U/L')}
					>
						Upper/Lower
					</button>
					<button
						type="button"
						class="rounded-r-md px-2 text-xs font-medium {selected_jaw === 'lower'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'lower')}
					>
						Lower Only
					</button>
					<input type="text" name="selected_jaw" bind:value={selected_jaw} hidden />
				</div>
			</div>
		</div>

		<!-- Second Row: Upper/Lower Sections -->
		<div class="flex flex-col gap-4">
			<!-- Upper Section -->
			{#if selected_jaw === 'U/L' || selected_jaw === 'upper'}
				<div class="rounded-md border border-gray-200 p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-700">Upper</h3>
					<div class="grid grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_upper" class="block text-sm font-medium text-gray-700">
								Case type
								<select
									name="case_type_upper"
									bind:value={case_type_upper}
									required
									class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								>
									{#each data?.caseTypes as caseType}
										<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
									{/each}
								</select>
							</label>
						</div>

						<!-- Case Number -->
						<div>
							<label for="case_number_upper" class="block text-sm font-medium text-gray-700">
								Case number
								<input
									type="text"
									name="case_number_upper"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={next_case_upper}
									disabled
								/>
								<input type="hidden" name="case_number_upper" value={next_case_upper} />
							</label>
						</div>
						<!-- Description -->
						<div>
							<label for="upper_description" class="block text-sm font-medium text-gray-700">
								Description
								<textarea
									name="upper_description"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									rows="1"
								></textarea>
							</label>
						</div>
						<!-- Unit -->
						<div>
							<label for="upper_unit" class="block text-sm font-medium text-gray-700">
								Unit
								<input
									type="number"
									id="upper_unit"
									name="upper_unit"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Units"
									min="1"
									defaultValue="1"
								/>
							</label>
						</div>

						<!-- Cost -->
						<div>
							<label for="upper_cost" class="block text-sm font-medium text-gray-700">
								Cost
								<input
									type="number"
									id="upper_cost"
									name="upper_cost"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Cost per unit"
									min="0"
									required
								/>
							</label>
						</div>
					</div>
				</div>
			{/if}

			<!-- Lower Section (Similar structure to Upper) -->
			{#if selected_jaw === 'U/L' || selected_jaw === 'lower'}
				<div class="rounded-md border border-gray-200 p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-700">Lower</h3>
					<div class="grid grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_lower" class="block text-sm font-medium text-gray-700">
								Case type
								<select
									name="case_type_lower"
									bind:value={case_type_lower}
									required
									class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								>
									{#each data?.caseTypes as caseType}
										<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
									{/each}
								</select>
							</label>
						</div>

						<!-- Case Number -->
						<div>
							<label for="case_number_lower" class="block text-sm font-medium text-gray-700">
								Case number
								<input
									type="text"
									name="case_number_lower"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={next_case_lower}
									disabled
								/>
								<input type="hidden" name="case_number_lower" value={next_case_lower} />
							</label>
						</div>
<!-- Description -->
						<div>
							<label for="lower_description" class="block text-sm font-medium text-gray-700">
								Description
								<textarea
									name="lower_description"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									rows="1"
								></textarea>
							</label>
						</div>
						<!-- Unit -->
						<div>
							<label for="lower_unit" class="block text-sm font-medium text-gray-700">
								Unit
								<input
									type="number"
									id="lower_unit"
									name="lower_unit"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Units"
									min="1"
									defaultValue="1"
								/>
							</label>
						</div>

						<!-- Cost -->
						<div>
							<label for="lower_cost" class="block text-sm font-medium text-gray-700">
								Cost
								<input
									type="number"
									id="lower_cost"
									name="lower_cost"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Cost per unit"
									min="0"
									required
								/>
							</label>
						</div>

						
					</div>
				</div>
			{/if}
		</div>

		<!-- Third Row: Image and Payment -->
		<div class="grid grid-cols-2 gap-4">
			<!-- IN Image Column -->
			<div class="rounded-md border border-gray-200 p-4">
				<div class="mb-2 flex flex-col gap-2">
					<label class="block text-sm font-bold text-gray-700"> IN Image </label>
					{#if !show_in}
						<p class="mb-2 text-sm text-gray-500">No image uploaded yet</p>
					{/if}
					<div class="flex gap-2">
						<button
							type="button"
							class="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
							onclick={async () => {
								try {
									if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
										throw new Error("Your browser doesn't support camera access");
									}

									showCameraModal = true;
									await startCamera();
								} catch (err) {
									console.error('Camera initialization error:', err);
									if (err instanceof Error) {
										alert(err.message);
									} else {
										alert('Could not initialize camera');
									}
									showCameraModal = false;
								}
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
									clip-rule="evenodd"
								/>
							</svg>
							Use Camera
						</button>
						<label
							class="flex cursor-pointer items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
						>
							<input
								type="file"
								name="in-img"
								class="w-24"
								accept="image/*"
								bind:this={in_file}
								onchange={handleInImageChange}
								required
							/>
						</label>
					</div>
				</div>
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
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
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
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						/>
					</label>
				</div>
			</div>

			<!-- Payment Information Column -->
			<div class="rounded-md border border-gray-200 p-4">
				<h3 class="mb-3 text-sm font-bold text-gray-700">Payment Information</h3>

				<!-- Total Amount -->
				<div class="mb-4">
					<label for="total_amount" class="mb-2 block text-sm font-bold text-gray-700">
						Total Amount
						<input
							type="number"
							id="total_amount"
							name="total_amount"
							bind:value={total_amount}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="0.00"
							min="0"
							step="0.01"
							required
						/>
					</label>
				</div>

				<!-- Paid Amount -->
				<div class="mb-4">
					<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
						Paid Amount
						<input
							type="number"
							id="paid_amount"
							name="paid_amount"
							bind:value={paid_amount}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="0.00"
							min="0"
							step="0.01"
							required
						/>
					</label>
				</div>

				<!-- Payment Method -->
				<div class="mb-4">
					<label for="payment_method" class="mb-2 block text-sm font-bold text-gray-700">
						Payment Method
					</label>
					<select
						name="payment_method"
						bind:value={payment_method}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					>
						<option value="cash">Cash</option>
						<option value="gcash">GCash</option>
						<option value="bank">Bank Transfer</option>
						<option value="others">Others</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex flex-col items-center justify-center pt-4">
			<button
				class="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				type="submit">Add Record</button
			>
			{#if form?.success}
				<p class="mt-2 font-semibold text-green-500">{form.success}</p>
			{:else if form?.error}
				<p class="mt-2 text-red-500">Error: {form?.error}</p>
			{/if}
		</div>
	</form>
</div>

{#if showCameraModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex justify-between">
				<h3 class="text-lg font-medium">Take Photo</h3>
				<button type="button" class="text-gray-400 hover:text-gray-500" onclick={closeCameraModal}>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="relative">
				<video bind:this={videoElement} autoplay playsinline class="rounded-lg max-w-78"></video>
				<canvas bind:this={canvasElement} class="hidden"></canvas>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					onclick={closeCameraModal}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					onclick={captureImage}
				>
					Capture
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showSettingsModal}
	<div class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
		<div class="w-96 rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex justify-between">
				<h3 class="text-lg font-medium text-gray-900">Camera Access Required</h3>
				<button
					type="button"
					class="text-gray-400 hover:text-gray-500"
					onclick={closeSettingsModal}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="mb-4">
				<p class="text-sm text-gray-500">To use the camera feature, you need to:</p>
				<ol class="mt-2 list-decimal pl-4 text-sm text-gray-600">
					<li class="mb-2">
						Open Chrome settings by copying this URL:
						<code class="ml-2 rounded bg-gray-100 px-2 py-1 text-sm">
							chrome://flags/#unsafely-treat-insecure-origin-as-secure
						</code>
					</li>
					<li class="mb-2">Enable the flag for this site</li>
					<li>Restart your browser</li>
				</ol>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
					onclick={closeSettingsModal}
				>
					Close
				</button>
				<button
					type="button"
					class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
					onclick={() => {
						navigator.clipboard.writeText(
							'chrome://flags/#unsafely-treat-insecure-origin-as-secure'
						);
						alert('URL copied to clipboard!');
					}}
				>
					Copy URL
				</button>
			</div>
		</div>
	</div>
{/if}
