<script lang="ts">
	import { goto } from '$app/navigation';
	import '../app.css';
	let { children } = $props();
</script>

<nav class=" top-0 left-0 z-50 w-full bg-gray-800 text-white shadow-md print:hidden">
	<div class=" mx-auto flex items-center justify-between px-4 py-2">
		<button
			onclick={async () => {
				await goto('/');
				window.location.reload();
			}}
			class="text-lg font-bold transition-colors duration-200 hover:text-gray-300"
		>
			Home
		</button>
		<div class="top-7 right-5 flex justify-between gap-2">
			<a
				class=" rounded border border-gray-300 bg-gray-500 p-2 text-white shadow-sm hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/edit_info">EDIT INFOS</a
			>
			<button
				onclick={() => window.print()}
				class=" rounded border border-gray-300 bg-red-500 p-2 text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				>PRINT</button
			>
			<a
				class=" rounded border border-gray-300 bg-blue-500 p-2 text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/upload_record">ADD RECORD</a
			>
		</div>
	</div>
</nav>

<div class="pt-2">
	{@render children()}
</div>
