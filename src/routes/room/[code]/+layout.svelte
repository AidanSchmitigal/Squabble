<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	let { data, children } = $props();
	let roomCode = $derived(data.roomCode);

	onMount(() => {
		roomState.connect(roomCode);
		return () => {
			roomState.disconnect();
		};
	});
</script>

<svelte:head>
	<title>Squabble &mdash; {roomCode}</title>
</svelte:head>

<div class="fixed top-1 right-1 flex gap-1 select-none">
	{#each 'SQUABBLE'.split('') as ch}
		<div
			class="size-5 rounded-[5px] flex items-center justify-center font-display text-xs border border-border bg-surface"
		>
			{ch}
		</div>
	{/each}
</div>

{#if !roomState.ready}
	<section class="screen" id="screen-main" style="justify-content:center;text-align:center">
		<div style="font-family:var(--font-mono);color:var(--ink-dim)">Connecting to {roomCode}...</div>
	</section>
{:else}
	{@render children()}
{/if}
