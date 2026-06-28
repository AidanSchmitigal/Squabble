<script lang="ts">
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import { type GameState } from '$lib/game';
	import { play } from '$lib/feedback.svelte';
	import { onMount } from 'svelte';

	let { gameState, selfId }: { gameState: GameState; selfId: string } = $props();

	let me = $derived(gameState.players.find((p) => p.id === selfId));
	let isEliminated = $derived(!!me?.eliminated);
	let placement = $derived(me ? gameState.players.length - gameState.aliveCount + 1 : null);

	onMount(() => {
		if (isEliminated) {
			play('eliminate');
			navigator.vibrate?.(30);
		}
	});
</script>

<section class="screen">
	<div class="w-full mx-auto flex flex-col gap-3 items-center pt-8">
		{#if isEliminated}
			<div class="font-display text-2xl text-red">💀 ELIMINATED</div>
			<div class="font-mono text-xs text-ink-dim">
				Placed #{placement}/{gameState.players.length} &middot; {gameState.aliveCount} player{gameState.aliveCount !==
				1
					? 's'
					: ''} alive &middot; {gameState.players.length} total
			</div>
		{:else}
			<div class="font-display text-2xl text-ink-dim">👁 Spectating</div>
			<div class="font-mono text-xs text-ink-faint">
				{gameState.aliveCount} player{gameState.aliveCount !== 1 ? 's' : ''} alive &middot; {gameState
					.players.length} total
			</div>
		{/if}

		<div class="w-full max-w-xl grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 mt-6">
			{#each gameState.players as p (p.id)}
				<div
					class="flex flex-col gap-1.5 p-3 bg-surface border border-border rounded-sm"
					class:opacity-50={!p.connected}
				>
					<PlayerCard player={p} {gameState} />
					<div class="font-mono text-[10px] text-ink-faint text-right">
						Word {p.wordIndex + 1} &middot; #{p.wordsSolved} solved
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
