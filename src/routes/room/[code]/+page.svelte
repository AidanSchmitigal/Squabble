<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';
	import Game from './Game.svelte';
	import Lobby from './Lobby.svelte';
	import Results from './Results.svelte';
	import { randomAvatar, sanitizeName, type Avatar } from '$lib/game';

	let gameState = $derived(roomState.gameState);
	let phase = $derived(gameState.phase);
	let selfId = $derived(roomState.selfId);

	// TODO: Check if game is already going and if so, check if this player was already in the game, and if not say "Game already started", and if yes in then reconnect them like nothing happened
</script>

{#if phase === 'lobby'}
	<Lobby {gameState} {selfId} />
{:else if phase === 'playing'}
	<Game {gameState} {selfId} />
{:else if phase === 'finished'}
	<Results {gameState} {selfId} />
{/if}
