<script lang="ts">
	import PlayerCard from '$lib/components/PlayerCard.svelte';
	import { type GameState } from '$lib/game';

	let { gameState }: { gameState: GameState } = $props();
</script>

<section class="screen">
	<div class="w-full mx-auto flex flex-col gap-3 items-center pt-8">
		<div class="font-display text-2xl text-ink-dim">👁 Spectating</div>
		<div class="font-mono text-xs text-ink-faint">
			{gameState.aliveCount} player{gameState.aliveCount !== 1 ? 's' : ''} alive &middot; {gameState
				.players.length} total
		</div>

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
