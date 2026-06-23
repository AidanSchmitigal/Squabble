<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let roomCode = $derived(data.roomCode);
	let noPresenter = $derived(roomState.ready && roomState.gameState.presenterId === null);

	onMount(() => {
		roomState.connect(roomCode);
	});
</script>

<svelte:head>
	<title>Perspective Party — {roomCode}</title>
	<meta name="description" content="Perspective Party room {roomCode}." />
</svelte:head>

{#if !roomState.ready}
	Connecting...
{:else}
	{#if noPresenter}
		<div class="text-center font-title font-bold text-lg color-ink bg-coral ink px-5 py-2 mb-4">
			No presenter connected
		</div>
	{/if}
	{@render children()}
{/if}
