<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import Game from './Game.svelte';
	import Lobby from './Lobby.svelte';
	import Results from './Results.svelte';
	import Spectate from './Spectate.svelte';

	let gameState = $derived(roomState.gameState);
	let phase = $derived(gameState.phase);
	let selfId = $derived(roomState.selfId);
	let isAlivePlayer = $derived(
		!!gameState.players.find((p) => p.id === selfId && !p.eliminated)
	);
</script>

{#if phase === 'lobby'}
	<Lobby {gameState} {selfId} />
{:else if phase === 'playing' && isAlivePlayer}
	<Game {gameState} {selfId} />
{:else if phase === 'playing'}
	<Spectate {gameState} {selfId} />
{:else if phase === 'finished'}
	<Results {gameState} {selfId} />
{/if}
