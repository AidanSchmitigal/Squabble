<script lang="ts">
	import { evaluateGuess, WORD_LEN, type GameState, type SquabblePlayer } from '$lib/game';

	let {
		player,
		gameState
	}: {
		player: SquabblePlayer;
		gameState: GameState;
	} = $props();

	let hpPct = $derived(Math.min(100, Math.max(0, player.hp)));
	let overhealPct = $derived(player.hp > 100 ? ((player.hp - 100) / 100) * 100 : 0);

	let hit = $state(false);
	let heal = $state(false);
	let prevHp: number | undefined;
	$effect(() => {
		const hp = player.hp;
		if (prevHp !== undefined) {
			const delta = hp - prevHp;
			if (delta < -1) {
				hit = true;
				setTimeout(() => hit = false, 400);
			} else if (delta > 0) {
				heal = true;
				setTimeout(() => heal = false, 400);
			}
		}
		prevHp = hp;
	});
</script>

<div class="card" class:hit={hit} class:heal={heal}>
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
			{#if overhealPct > 0}
				<div
					class="absolute inset-y-0 right-0 h-full bg-blue transition-[width]"
					style="width:{overhealPct}%"
				></div>
			{/if}
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
</div>

<style>
	.card {
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 8px 10px;
		display: flex;
		flex-direction: column;
		gap: 6px;
		background: var(--surface);
		transition: border-color 0.2s;
	}
	.card.hit {
		border-color: var(--red);
		animation: hitFlash 0.4s ease;
	}
	.card.heal {
		border-color: var(--green);
		animation: healFlash 0.4s ease;
	}
	@keyframes hitFlash {
		0% {
			background: rgba(229, 72, 77, 0.25);
		}
		100% {
			background: var(--surface);
		}
	}
	@keyframes healFlash {
		0% {
			background: rgba(90, 181, 82, 0.25);
		}
		100% {
			background: var(--surface);
		}
	}
</style>
