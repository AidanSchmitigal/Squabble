<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import Lobby from './Lobby.svelte';
	import Study from './Study.svelte';
	import Draw from './Draw.svelte';
	import Reveal from './Reveal.svelte';
	import Scores from './Scores.svelte';
	import Final from './Final.svelte';
</script>

{#if roomState.gameState.phase == 'lobby'}
	<Lobby />
{:else if roomState.gameState.phase == 'study'}
	<Study />
{:else if roomState.gameState.phase == 'draw'}
	<Draw />
{:else if roomState.gameState.phase == 'reveal'}
	<Reveal />
{:else if roomState.gameState.phase == 'scores'}
	<Scores />
{:else if roomState.gameState.phase == 'finished'}
	<Final />
{/if}
