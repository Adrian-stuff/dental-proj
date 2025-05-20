<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const { record, orderItems, history } = data;

	// Format currency
	function formatCurrency(amount: number | null): string {
		if (!amount) return '₱0.00';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format date and time
	function formatDateTime(date: string | null, time: string | null): string {
		if (!date) return 'Not set';
		const formattedDate = new Date(date).toLocaleDateString();
		return time ? `${formattedDate} ${time}` : formattedDate;
	}
</script>

<div class="container mx-auto px-4 py-8 print:m-0 print:w-full print:p-0">
	<div class="mb-8 print:mb-2">
		<h1 class="text-3xl font-bold text-gray-900 print:mb-1 print:text-xl">
			Case Details #{record.recordId}
		</h1>
		<p class="text-sm text-gray-500 print:text-xs">
			Created on {new Date(record.createdAt).toLocaleDateString()}
		</p>
	</div>

	<!-- Case Details Card -->
	<div
		class="mb-8 rounded-lg bg-white p-6 shadow-lg print:mb-3 print:border-0 print:p-0 print:shadow-none"
	>
		<h2 class="mb-4 text-xl font-semibold text-gray-800 print:mb-2 print:text-base">
			Case Information
		</h2>
		<div
			class="grid gap-4 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2 print:text-sm"
		>
			<!-- Basic Information -->
			<div>
				<p class="text-sm font-medium text-gray-500">Record ID</p>
				<p class="text-lg text-gray-900">#{record.recordId}</p>
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

			<!-- Dates -->
			<div>
				<p class="text-sm font-medium text-gray-500">Pickup</p>
				<p class="text-lg text-gray-900">
					{formatDateTime(record.datePickup, record.timePickup)}
				</p>
			</div>
			<div>
				<p class="text-sm font-medium text-gray-500">Dropoff</p>
				<p class="text-lg text-gray-900">
					{formatDateTime(record.dateDropoff, record.timeDropoff)}
				</p>
			</div>

			<!-- Order Information -->
			{#if record.orderInfo}
				<div>
					<p class="text-sm font-medium text-gray-500">Order Total</p>
					<p class="text-lg text-gray-900">
						{formatCurrency(+record.orderInfo.orderTotal)}
					</p>
				</div>
				<div>
					<p class="text-sm font-medium text-gray-500">Payment Status</p>
					<p
						class="text-lg capitalize {record.orderInfo.paymentStatus === 'paid'
							? 'bg-green-100 text-green-600'
							: 'bg-red-100 text-red-600'}"
					>
						{record.orderInfo.paymentStatus}
					</p>
				</div>
				<div>
					<p class="text-sm font-medium text-gray-500">Payment Method</p>
					<p class="text-lg text-gray-900 capitalize">
						{record.orderInfo.paymentMethod}
					</p>
				</div>
			{/if}

			<div class="col-span-full">
				<p class="text-sm font-medium text-gray-500">Remarks</p>
				<p class="text-lg text-gray-900">{record.remarks || 'No remarks'}</p>
			</div>
		</div>
	</div>

	<!-- Order Items -->
	{#if orderItems && orderItems.length > 0}
		<div class="mb-8 rounded-lg bg-white p-6 shadow-lg print:mb-3 print:p-0 print:shadow-none">
			<h2 class="mb-4 text-xl font-semibold text-gray-800 print:mb-2 print:text-base">
				Order Items
			</h2>
			<div class="overflow-x-auto print:overflow-visible">
				<table class="min-w-full divide-y divide-gray-200 print:text-sm">
					<thead>
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-[10px]"
							>
								Type
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-[10px]"
							>
								Case No
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-[10px]"
							>
								Quantity
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-[10px]"
							>
								Cost
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase print:px-2 print:py-1 print:text-[10px]"
							>
								Description
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200">
						{#each orderItems as item}
							<tr class="print:text-xs">
								<td class="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
									{item.upOrDown}
								</td>
								<td class="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
									{item.caseNo}
								</td>
								<td class="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
									{item.itemQuantity}
								</td>
								<td class="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
									{formatCurrency(+item.itemCost)}
								</td>
								<td class="px-6 py-4">
									{item.orderDescription || '-'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Case History -->
	{#if history && history.length > 0}
		<div class="rounded-lg bg-white p-6 shadow-lg print:p-0 print:shadow-none">
			<h2 class="mb-4 text-xl font-semibold text-gray-800 print:mb-2 print:text-base">
				Case History
			</h2>
			<div class="flow-root">
				<ul class="-mb-8 print:mb-0 print:text-sm">
					{#each history as event, index}
						<li>
							<div class="relative pb-8 print:pb-2">
								{#if index !== history.length - 1}
									<span
										class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 print:hidden"
										aria-hidden="true"
									></span>
								{/if}
								<div class="relative flex items-start space-x-3 print:space-x-2">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 print:h-4 print:w-4"
									>
										<span class="text-sm text-gray-500 print:text-xs">📝</span>
									</div>
									<div class="min-w-0 flex-1">
										<div class="text-sm text-gray-500 print:text-xs">
											<span class="font-medium text-gray-900">
												{event.historyType}
											</span>
											<span class="ml-2">
												{new Date(event.historyDate).toLocaleDateString()}
											</span>
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

	<!-- Action Buttons remain hidden in print -->
	<div class="mt-6 flex justify-end space-x-4 print:hidden">
		<a
			href="/"
			class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:outline-none"
		>
			Back to List
		</a>
	</div>
</div>
