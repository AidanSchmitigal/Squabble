<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import Game from './Game.svelte';
	import Lobby from './Lobby.svelte';
	import Results from './Results.svelte';
	import Spectate from './Spectate.svelte';

	let gameState = $derived(roomState.gameState);
	let phase = $derived(gameState.phase);
	let selfId = $derived(roomState.selfId);
	let isPlayer = $derived(gameState.players.some((p) => p.id === selfId));
</script>

{#if phase === 'lobby'}
	<Lobby {gameState} {selfId} />
{:else if phase === 'playing' && isPlayer}
	<Game {gameState} {selfId} />
{:else if phase === 'playing'}
	<Spectate {gameState} />
{:else if phase === 'finished'}
	<Results {gameState} {selfId} />
{/if}
