<script lang="ts">
	import { page } from '$app/stores';
	import type { PageData } from './$types';

	export let data: PageData;
	const { record, history } = data;

	// Format date and time
	function formatDateTime(date: string | null, time: string | null): string {
		if (!date) return 'Not set';
		const formattedDate = new Date(date).toLocaleDateString();
		return time ? `${formattedDate} ${time}` : formattedDate;
	}

	// Format currency
	function formatCurrency(amount: number | null): string {
		if (amount === null) return '₱0.00';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">
			Case Details #{record.caseNo}
		</h1>
		<p class="text-sm text-gray-500">
			Created on {new Date(record.createdAt).toLocaleDateString()}
		</p>
	</div>

	<!-- Case Details Card -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-lg">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">Case Information</h2>
		<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			<!-- Basic Information -->
			<div>
				<p class="text-sm font-medium text-gray-500">Case Type</p>
				<p class="text-lg text-gray-900">{record.caseType || 'N/A'}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Patient Name</p>
				<p class="text-lg text-gray-900">{record.patientName}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Clinic</p>
				<p class="text-lg text-gray-900">{record.clinicName}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Doctor</p>
				<p class="text-lg text-gray-900">{record.doctorName}</p>
			</div>

			<!-- Dates and Times -->
			<div>
				<p class="text-sm font-medium text-gray-500">Pickup Date & Time</p>
				<p class="text-lg text-gray-900">
					{formatDateTime(record.datePickup, record.timePickup)}
				</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Dropoff Date & Time</p>
				<p class="text-lg text-gray-900">
					{formatDateTime(record.dateDropoff, record.timeDropoff)}
				</p>
			</div>

			<!-- Financial Information -->
			<div>
				<p class="text-sm font-medium text-gray-500">Total Amount</p>
				<p class="text-lg text-gray-900">{formatCurrency(+record.totalAmount)}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Paid Amount</p>
				<p class="text-lg text-gray-900">{formatCurrency(+record.paidAmount)}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Excess Payment</p>
				<p class="text-lg text-gray-900">{formatCurrency(parseInt(record.excessPayment))}</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Payment Method</p>
				<p class="text-lg text-gray-900 capitalize">{record.paymentMethod || 'Not specified'}</p>
			</div>

			<!-- Description and Remarks -->
			<div class="col-span-full">
				<p class="text-sm font-medium text-gray-500">Description</p>
				<p class="text-lg text-gray-900">{record.description || 'No description provided'}</p>
			</div>
			<div class="col-span-full">
				<p class="text-sm font-medium text-gray-500">Remarks</p>
				<p class="text-lg text-gray-900">{record.remarks || 'No remarks'}</p>
			</div>
		</div>
	</div>

	<!-- Case History -->
	{#if history && history.length > 0}
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Case History</h2>
			<div class="flow-root">
				<ul class="-mb-8">
					{#each history as event, index}
						<li>
							<div class="relative pb-8">
								{#if index !== history.length - 1}
									<span
										class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
										aria-hidden="true"
									></span>
								{/if}
								<div class="relative flex items-start space-x-3">
									<div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
										<!-- You can add icons here based on history type -->
										<span class="text-sm text-gray-500">📝</span>
									</div>
									<div class="min-w-0 flex-1">
										<div class="text-sm text-gray-500">
											<span class="font-medium text-gray-900">{event.historyType}</span>
											<span class="ml-2">{new Date(event.historyDate).toLocaleDateString()}</span>
										</div>
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	<!-- Action Buttons -->
	<div class="mt-6 flex justify-end space-x-4">
		<a
			href="/"
			class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
		>
			Back to List
		</a>
	</div>
</div>
