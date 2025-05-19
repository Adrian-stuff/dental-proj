<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const { record } = data;

	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let in_file: HTMLInputElement | undefined = $state();
	let in_img: HTMLImageElement | undefined = $state();
	let show_in: boolean = $state(false);
	let showCameraModal = $state(false);
	let stream: MediaStream | null = $state(null);
	let videoElement: HTMLVideoElement = $state();
	let canvasElement: HTMLCanvasElement = $state();
	let showSettingsModal = $state(false);

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

	// Function to handle camera operations
	async function startCamera() {
		try {
			const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });

			if (permissions.state === 'denied') {
				showSettingsModal = true;
				throw new Error('Camera permission was denied');
			}

			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false
			});

			if (videoElement) {
				videoElement.srcObject = stream;
				// Add event listener when camera starts
				window.addEventListener('keydown', handleKeyPress);
				await new Promise((resolve) => {
					videoElement.onloadedmetadata = () => resolve(true);
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
		// Remove event listener when modal closes
		window.removeEventListener('keydown', handleKeyPress);
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.code === 'Space' && showCameraModal) {
			e.preventDefault();
			captureImage();
		}
	}

	function closeSettingsModal() {
		showSettingsModal = false;
	}

	onDestroy(() => {
		stopCamera();
	});
</script>

<div class="bg-white-100 flex flex-col items-center justify-center rounded-md p-8">
	<h1 class="mb-4 text-2xl font-semibold">Record Details</h1>
	<div class="mb-4 text-gray-600">
		<p>Patient: {record.patientName}</p>
		<p>Doctor: {record.doctorName}</p>
		<p>Clinic: {record.clinicName}</p>
	</div>

	<form
		method="POST"
		enctype="multipart/form-data"
		class="flex w-full max-w-md flex-col items-start justify-center space-y-6 rounded border border-gray-300 bg-red-100 px-8 py-6"
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		<label for="date" class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Date</span>
			<input
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				type="date"
				name="date"
				placeholder="Date"
				required
				bind:value={date}
			/>
		</label>
		<label for="time" class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Time</span>
			<input
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				type="time"
				name="time"
				placeholder="Time"
				required
				bind:value={time}
			/>
		</label>

		<div class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Image</span>
			<div class="flex gap-2 mb-2">
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
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
					</svg>
					Use Camera
				</button>
				<input
					class="mt-1 w-full rounded-md border-2 border-dashed border-gray-400 px-2 py-3 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					type="file"
					name="out-img"
					accept="image/*"
					bind:this={in_file}
					onchange={handleInImageChange}
					required
				/>
			</div>
			{#if show_in}
				<div class="mt-2 flex justify-center">
					<img class="h-auto w-70 rounded-md object-cover" bind:this={in_img} alt="OUT Preview" />
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				name="finished"
				class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
			/>
			<label for="finished" class="text-sm font-medium text-gray-700"> Mark as Finished </label>
		</div>

		<div class="mt-4 flex w-full justify-center">
			<button
				class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				type="submit">Add OUT</button
			>
		</div>
	</form>
</div>

{#if showCameraModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
		<div class="bg-white p-6 rounded-lg shadow-xl">
			<div class="flex justify-between mb-4">
				<h3 class="text-lg font-medium">Take Photo</h3>
				<button type="button" class="text-gray-400 hover:text-gray-500" onclick={closeCameraModal}>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
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
					class="rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					onclick={closeCameraModal}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
		<div class="w-96 bg-white p-6 rounded-lg shadow-xl">
			<div class="flex justify-between mb-4">
				<h3 class="text-lg font-medium text-gray-900">Camera Access Required</h3>
				<button type="button" class="text-gray-400 hover:text-gray-500" onclick={closeSettingsModal}>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="mb-4">
				<p class="text-sm text-gray-500">To use the camera feature, you need to:</p>
				<ol class="mt-2 list-decimal pl-4 text-sm text-gray-600">
					<li class="mb-2">Open Chrome settings by copying this URL:
						<code class="ml-2 bg-gray-100 px-2 py-1 rounded text-sm">
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
					class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
