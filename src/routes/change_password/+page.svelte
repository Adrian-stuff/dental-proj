<script lang="ts">
	import { enhance } from '$app/forms';
	const { data } = $props();
	let current = $state('');
	let next = $state('');
	let confirmNext = $state('');
	let message = $state('');
	let error = $state('');
	$effect(() => {
		message = '';
		error = '';
	});
</script>

<div class="mx-auto max-w-md p-4">
	<h1 class="mb-4 text-xl font-semibold">Change Password</h1>
	{#if message}
		<div class="mb-3 rounded bg-green-50 p-2 text-sm text-green-700">{message}</div>
	{/if}
	{#if error}
		<div class="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
	{/if}
	<form
		method="POST"
		use:enhance={() => {
			return async ({ result }) => {
				if (result.type === 'failure') {
					const d = result.data as any;
					error = d?.error || 'Failed to update password';
					message = '';
					return;
				}
				if (result.type === 'success') {
					const d = result.data as any;
					message = d?.message || 'Password updated successfully';
					error = '';
					current = '';
					next = '';
					confirmNext = '';
					return;
				}
			};
		}}
	>
		{#if data.isSet}
			<label for="current" class="block text-sm font-medium text-gray-700">Current password</label>
			<input
				id="current"
				name="current"
				type="password"
				class="mt-1 mb-3 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
				required
			/>
		{/if}
		<label for="next" class="block text-sm font-medium text-gray-700">New password</label>
		<input
			id="next"
			name="next"
			bind:value={next}
			type="password"
			class="mt-1 mb-3 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
			required
		/>
		<label for="confirm" class="block text-sm font-medium text-gray-700">Confirm new password</label
		>
		<input
			id="confirm"
			name="confirm"
			bind:value={confirmNext}
			type="password"
			class="mt-1 mb-4 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
			required
		/>
		<div class="flex gap-2">
			<a href="/" class="rounded bg-white px-3 py-1 text-sm ring-1 ring-gray-300">Cancel</a>
			<button type="submit" class="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Save</button>
		</div>
	</form>
</div>
