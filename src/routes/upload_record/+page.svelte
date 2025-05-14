<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let allDoctors = $state(data?.doctors);
	let allClinics = $state(data?.clinics);
	let filteredDoctors = $state<{ value: string; label: string; clinicId: number }[]>(allDoctors);
	let filteredClinics = $state<{ value: string; label: string; clinicId: number }[]>(allClinics);

	let selectedDoctor: { value: string; label: string; clinicId: number } | null = $state(null);
	let selectedClinic: { value: string; label: string; clinicId: number } | null = $state(null);

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

	let doctorInputValue = $state('');
	let clinicInputValue = $state('');
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let payment_method = $state('cash');
	let other_payment_method = $state('');
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
		// Filter doctors based on the selected clinic
		filteredDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
		// If a doctor was previously selected and is not in the new clinic, reset
		if (selectedDoctor && selectedDoctor.clinicId !== clinic.clinicId) {
			selectedDoctor = null;
			doctorInputValue = '';
		} else if (filteredDoctors.length === 1) {
			// Automatically select the doctor if only one is available in the clinic
			selectedDoctor = filteredDoctors[0];
			doctorInputValue = filteredDoctors[0].label;
		}
	}

	// Add these new state variables
	let showCameraModal = $state(false);
	let stream: MediaStream | null = $state(null);
	let videoElement: HTMLVideoElement = $state();
	let canvasElement: HTMLCanvasElement = $state();
	let showSettingsModal = $state(false);

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

<div class="mt-8 flex justify-center">
	<form
		class="mb-4 flex w-full max-w-lg flex-col gap-6 rounded-md bg-white px-8 pb-8 shadow-md"
		method="POST"
		enctype="multipart/form-data"
	>
		<h2 class=" text-center text-2xl font-semibold text-gray-800">Add New Record</h2>
		<div class="flex flex-row gap-8">
			<div class="flex w-1/2 flex-col gap-4">
				<label for="case_type" class="mb-2 block text-sm font-bold text-gray-700">
					Case type
					<select
						name="case_type"
						bind:value={case_type}
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					>
						{#each data?.caseTypes as caseType}
							<option value={caseType.caseType}>{caseType.caseType}</option>
						{/each}
					</select>
				</label>
				<label for="case_number" class="mb-2 block text-sm font-bold text-gray-700">
					Case number
					<input
						type="text"
						name="case_number"
						class="block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Case number"
						value={data?.caseTypes.find((caseType) => caseType.caseType === case_type)
							?.numberOfCases + 1}
						disabled
					/>
				</label>
			</div>
			<div class="flex w-1/2 flex-col gap-4">
				<div class="relative">
					<label for="clinic_name" class="mb-2 block text-sm font-bold text-gray-700">
						Clinic
						<input
							type="text"
							id="clinic_name"
							name="clinic_name"
							autocomplete="off"
							bind:value={clinicInputValue}
							oninput={filterClinics}
							onfocus={() => {
								showClinicDropdown = true; // Show dropdown on focus
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
									<span class="block truncate">{clinic.label}</span>
									{#if selectedClinic?.value === clinic.value}
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
					<input type="hidden" name="clinic_name" value={selectedClinic?.value} />
				</div>

				<div class="relative">
					<label for="doctor_name" class="mb-2 block text-sm font-bold text-gray-700">
						Doctor
						<input
							type="text"
							id="doctor_name"
							name="doctor_name"
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
									id={`doctor-option-${doctor.value}`}
									role="option"
									onclick={() => selectDoctor(doctor)}
									onkeydown={(event) => {
										if (event.key === 'Enter') {
											selectDoctor(doctor);
										}
									}}
								>
									<span class="block truncate">{doctor.label}</span>
									{#if selectedDoctor?.value === doctor.value}
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
					<input type="hidden" name="doctor_name" value={selectedDoctor?.value} />
				</div>
			</div>
		</div>
		<div class="flex flex-col gap-4">
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
			<label for="description" class="mb-2 block text-sm font-bold text-gray-700">
				Description
				<textarea
					class="block h-24 w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					name="description"
					placeholder="Description"
				></textarea>
			</label>
		</div>
		<div class="flex flex-row justify-between gap-8">
			<div class="flex w-fit flex-col rounded-md border border-gray-300 p-6">
				<div class="mb-2 flex flex-col gap-2">
					<label class="block text-sm font-bold text-gray-700"> IN Image </label>
					<div class="flex gap-2">
						<button
							type="button"
							class="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
							onclick={async () => {
								try {
									// Check if the browser supports getUserMedia
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
									clip-rule="evenodd"
								/>
							</svg>
							Upload File
							<input
								type="file"
								name="in-img"
								accept="image/*"
								bind:this={in_file}
								onchange={handleInImageChange}
								required
								class="hidden"
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
			<div class="flex w-1/2 flex-col gap-4">
				<label
					for="total_amount"
					class="mb-2 block text-sm font-bold
          text-gray-700"
				>
					Total amount
					<input
						type="number"
						bind:value={total_amount}
						name="total_amount"
						placeholder="Total amount"
						accept="number"
						required
						autocomplete="off"
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</label>
				<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
					Paid amount
					<input
						type="number"
						bind:value={paid_amount}
						name="paid_amount"
						placeholder="Paid amount"
						autocomplete="off"
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</label>
				<label for="excess_payment" class="mb-2 block text-sm font-bold text-gray-700">
					Excess amount
					<input
						type="text"
						value={paid_amount && total_amount
							? paid_amount - total_amount
							: total_amount !== undefined
								? -total_amount
								: ''}
						name="excess_payment"
						placeholder="Excess amount"
						disabled
						class="block w-full cursor-not-allowed appearance-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
					<input
						type="hidden"
						value={paid_amount && total_amount
							? paid_amount - total_amount
							: total_amount !== undefined
								? -total_amount
								: ''}
						name="excess_payment"
					/>
				</label>
				<div class="mb-4">
					<label for="payment_method" class="mb-2 block text-sm font-bold text-gray-700">
						Payment Method
					</label>
					<select
						name="payment_method"
						bind:value={payment_method}
						class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						required
					>
						<option value="cash">Cash</option>
						<option value="gcash">GCash</option>
						<option value="bank">Bank Transfer</option>
						<option value="others">Others</option>
					</select>
				</div>

				{#if payment_method === 'others'}
					<div class="mb-4">
						<label for="other_payment_method" class="mb-2 block text-sm font-bold text-gray-700">
							Specify Payment Method
						</label>
						<input
							type="text"
							bind:value={other_payment_method}
							name="other_payment_method"
							placeholder="Enter payment method"
							required
							class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
						/>
					</div>
				{/if}

				<input
					hidden
					name="final_payment_method"
					value={payment_method === 'others' ? other_payment_method : payment_method}
				/>
			</div>
		</div>
		<div class="flex flex-col items-center justify-center">
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
				<video bind:this={videoElement} autoplay playsinline class="rounded-lg"></video>
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
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
				<p class="text-sm text-gray-500">
					To use the camera feature, you need to:
				</p>
				<ol class="mt-2 list-decimal pl-4 text-sm text-gray-600">
					<li class="mb-2">Open Chrome settings by copying this URL:
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
						navigator.clipboard.writeText('chrome://flags/#unsafely-treat-insecure-origin-as-secure');
						alert('URL copied to clipboard!');
					}}
				>
					Copy URL
				</button>
			</div>
		</div>
	</div>
{/if}
