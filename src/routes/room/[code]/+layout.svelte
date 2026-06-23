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

{#if !roomState.ready}
	<section class="screen active" id="screen-main" style="justify-content:center;text-align:center">
		<div style="font-family:var(--font-mono);color:var(--ink-dim)">Connecting to {roomCode}...</div>
	</section>
{:else}
	{@render children()}
{/if}
