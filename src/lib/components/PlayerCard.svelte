<script lang="ts">
	import { evaluateGuess, WORD_LEN, type GameState, type SquabblePlayer } from '$lib/game';

	let {
		player,
		gameState
	}: {
		player: SquabblePlayer;
		gameState: GameState;
	} = $props();

	let hpPct = $derived(Math.max(0, player.hp));
</script>

<div class="flex gap-2 items-center">
	<div class="size-8 border-2 border-border shrink-0">
		<img class="size-full" src={player.avatar} alt="{player.name} avatar" />
	</div>
	<div class="flex flex-col gap-0.5 min-w-0 flex-1">
		<div
			class="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis flex gap-2 items-baseline"
		>
			{player.name}
			{#if player.eliminated}<span class="skull">💀</span>{/if}
			{#if !player.connected}<span class="text-ink-faint text-[10px]">(disconnected)</span>{/if}
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
	{#each Array(6) as _, rowIdx (rowIdx)}
		{@const guess = player.guesses[rowIdx]}
		{#each Array(WORD_LEN) as _, colIdx (colIdx)}
			{@const result = guess
				? evaluateGuess(guess, gameState.words[player.wordIndex])[colIdx]
				: null}
			<div
				class="w-full aspect-square rounded-xs"
				class:bg-surface-2={!result}
				class:bg-green={result === 'correct'}
				class:bg-yellow={result === 'present'}
				class:bg-gray-tile={result === 'absent'}
				class:opacity-30={player.garbageMask[rowIdx]}
			></div>
		{/each}
	{/each}
</div>
