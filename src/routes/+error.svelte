<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>Error — Squabble</title>
</svelte:head>

<section class="screen justify-center items-center gap-4">
	<h1 class="font-display text-5xl font-bold text-red">{$page.status}</h1>
	<p class="font-mono text-sm text-ink-dim text-center max-w-md">
		{$page.error?.message ?? 'Something went wrong.'}
	</p>
	<a href={resolve("/")} class="btn btn-primary mt-4">Go home</a>
</section>

<style>
	.screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 24px;
	}
</style>
