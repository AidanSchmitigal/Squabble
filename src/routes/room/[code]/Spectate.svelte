<script lang="ts">
	import { type GameState } from '$lib/game';

	let { gameState }: { gameState: GameState } = $props();
</script>

<section class="screen">
	<div class="w-full mx-auto flex flex-col gap-3 items-center pt-8">
		<div class="font-display text-2xl text-ink-dim">👁 Spectating</div>
		<div class="font-mono text-xs text-ink-faint">
			{gameState.aliveCount} player{gameState.aliveCount !== 1 ? 's' : ''} alive &middot; {gameState.players.length} total
		</div>

		<div class="w-full max-w-xl grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4 mt-6">
			{#each gameState.players as p (p.id)}
				{@const hpPct = Math.max(0, p.hp)}
				<div class="flex flex-col gap-1.5 p-3 bg-surface border border-border rounded-sm" class:opacity-50={!p.connected}>
					<div class="flex gap-2 items-center">
						<div class="size-8 border-2 border-border shrink-0">
							<img class="size-full" src={p.avatar} alt="{p.name} avatar" />
						</div>
						<div class="flex flex-col gap-0.5 min-w-0 flex-1">
							<div class="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis flex gap-2 items-baseline">
								{p.name}
								{#if p.eliminated}<span class="skull">💀</span>{/if}
								{#if !p.connected}<span class="text-ink-faint text-[10px]">(disconnected)</span>{/if}
							</div>
							<div class="w-full h-2 bg-surface-2 rounded-full overflow-hidden border-border border relative">
								<div
									class="h-full transition-[width] {hpPct < 30
										? 'bg-red'
										: hpPct < 60
											? 'bg-yellow'
											: 'bg-green'}"
									style="width:{hpPct}%"
								></div>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-5 gap-0.5">
						{#each Array(5 * 6) as _, i (i)}
							<div
								class="w-full aspect-square bg-surface-2 rounded-xs"
								class:fill={p.miniGrid[i]}
							></div>
						{/each}
					</div>
					<div class="font-mono text-[10px] text-ink-faint text-right">
						Word {p.wordIndex + 1} &middot; #{p.wordsSolved} solved
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
