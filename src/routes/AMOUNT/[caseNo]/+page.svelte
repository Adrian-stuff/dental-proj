<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let caseNo = $state(data.caseNo);
	console.log('caseNo', data.recordData);
	let total_amount: number | undefined = $state(data.recordData?.totalAmount as number);
	let paid_amount: number | undefined = $state(data.recordData?.paidAmount as number);
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<form method="POST" class="mb-4 w-full max-w-md rounded bg-white px-8 pt-6 pb-8 shadow-md">
		<h2 class="mt-4 mb-6 block text-center text-xl font-bold text-gray-700">Payment Details</h2>
		<div class="mb-4">
			<label for="total_amount" class="mb-2 block text-sm font-bold text-gray-700">
				Total Amount
			</label>
			<input
				type="number"
				bind:value={total_amount}
				name="total_amount"
				placeholder="Enter total amount"
				accept="number"
				required
				class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
			/>
		</div>
		<div class="mb-4">
			<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
				Paid Amount
			</label>
			<input
				type="number"
				bind:value={paid_amount}
				name="paid_amount"
				placeholder="Enter paid amount"
				required
				class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
			/>
		</div>
		<div class="mb-6">
			<label for="excess_payment" class="mb-2 block text-sm font-bold text-gray-700">
				Excess Amount
			</label>
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
				class="focus:shadow-outline w-full cursor-not-allowed appearance-none rounded border bg-gray-200 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
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
		</div>
		<div class="flex items-center justify-between">
			<button
				class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none"
				type="submit"
			>
				Submit Payment
			</button>
			{#if form?.success}
				<p class="text-xs text-green-500 italic">{form.success}</p>
			{/if}
			{#if form?.error}
				<p class="text-xs text-red-500 italic">{form.error}</p>
			{/if}
		</div>
	</form>
</div>
