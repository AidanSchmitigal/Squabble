<script lang="ts">
	import { VALID } from '$lib/assets/valid';
	import { evaluateGuess, type GameState, WORD_LEN, type SquabblePlayer } from '$lib/game';
	import { roomState } from '$lib/room.svelte';

	let { gameState, selfId }: { gameState: GameState; selfId: string } = $props();

	let me = $derived(gameState.players.find((p) => p.id === selfId)!); // Assuming you can only get this far if you are in the game. Otherwise you should be spectating at a different route / component
	let others = $derived(gameState.players.filter((p) => p.id !== selfId));
	let othersFirstHalf = $derived(others.filter((_, i) => i % 2 === 0));
	let othersSecondHalf = $derived(others.filter((_, i) => i % 2 === 1));

	let currentGuess = $state('');
	let shakeRow: number | null = $state(null);
	let showEliminated = $state(false);

	let keyStates = $derived(me.keyStates || {});

	function typeLetter(ch: string) {
		if (me.eliminated) return;
		if (currentGuess.length >= WORD_LEN) return;
		currentGuess += ch;
	}

	function backspace() {
		if (me.eliminated) return;
		currentGuess = currentGuess.slice(0, -1);
	}

	function submitGuess() {
		if (me.eliminated) return;
		if (currentGuess.length != WORD_LEN) {
			shakeRow = me.guesses.length;
			setTimeout(() => (shakeRow = null), 400);
			return;
		}
		if (!VALID.has(currentGuess.toLowerCase())) {
			shakeRow = me.guesses.length;
			setTimeout(() => (shakeRow = null), 400);
			return;
		}
		const guess = currentGuess.toLowerCase();
		roomState.optimisticSubmitGuess(guess);
		roomState.send({ type: 'submit-guess', guess });
		currentGuess = '';
	}

	$effect(() => {
		function handler(e: KeyboardEvent) {
			if (e.key === 'Enter') submitGuess();
			else if (e.key === 'Backspace') backspace();
			else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toUpperCase());
		}
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});

	$effect(() => {
		if (me.eliminated && !showEliminated) showEliminated = true;
	});

	const healthColor = $derived.by(() => {
		if (me.eliminated || me.hp <= 30) return 'from-red-deep to-red';
		if (me.hp <= 60) return 'from-yellow-deep to-yellow';
		return 'from-green-deep to-green';
	});
</script>

<section class="screen">
	<div class="w-full mx-auto flex flex-col gap-3">
		<div
			class="grid grid-cols-[1fr_auto_1fr] items-center gap-4 flex-wrap bg-surface border border-border rounded-sm py-3 px-4 overflow-hidden sticky top-7 z-10"
		>
			<div class="font-mono text-xs text-ink-dim flex gap-2 items-center">
				Word <span class="text-ink font-bold text-sm">{me.wordIndex + 1}</span>
			</div>
			<div class="flex items-center gap-2 min-w-3xs">
				<span class="text-xs font-mono text-ink-dim uppercase min-w-8">HP</span>
				<div
					class="flex-1 h-4 bg-surface-2 rounded-sm overflow-hidden border-border border relative"
				>
					<div
						class="h-full bg-linear-90 {healthColor} transition-[width] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
						style="width:{Math.max(0, me.hp ?? 100)}%"
					></div>
				</div>
				<span class="font-mono font-bold text-sm min-w-8 text-right text-ink"
					>{Math.max(0, Math.round(me.hp ?? 100))}</span
				>
			</div>
			<div class="font-mono relative text-xs font-bold text-right text-white">
				<span class="">{gameState.aliveCount} alive</span>
				<div class="absolute -inset-5 text-xs bg-linear-270 from-yellow-glow to-transparent"></div>
			</div>
		</div>

		<div class="grid grid-cols-[1fr_auto_1fr] gap-4 w-full items-start">
			<div class="w-full grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-4 rtl">
				{@render opponents(othersFirstHalf)}
			</div>

			<div class="flex flex-col items-center gap-4 min-w-0 sticky top-22">
				<div class="flex flex-col gap-1.5">
					{#each Array(6) as _, rowIdx (rowIdx)}
						<div class="flex gap-1.5" class:shake={shakeRow === rowIdx}>
							{#each Array(WORD_LEN) as _, colIdx (colIdx)}
								{@const guess = me.guesses[rowIdx]}
								{@const letter = guess
									? guess[colIdx]
									: rowIdx === (me.guesses.length ?? 0)
										? currentGuess[colIdx]
										: ''}
								{@const result = guess
									? evaluateGuess(guess, gameState.words[me.wordIndex ?? 0])[colIdx]
									: null}
								<div
									class="tile"
									class:filled={!!letter}
									class:correct={result === 'correct'}
									class:present={result === 'present'}
									class:absent={result === 'absent'}
								>
									{letter}
								</div>
							{/each}
						</div>
					{/each}
				</div>

				<div class="flex flex-col gap-1.5 w-full">
					{#each ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'] as row, ri (ri)}
						<div class="flex gap-1.5 justify-center">
							{#if ri === 2}<button class="key wide" onclick={submitGuess}>ENTER</button>{/if}
							{#each row.split('') as ch, i (i)}
								{@const st = keyStates[ch.toLowerCase()]}
								<button
									class="key"
									class:correct={st === 'correct'}
									class:present={st === 'present'}
									class:absent={st === 'absent'}
									onclick={() => typeLetter(ch)}>{ch}</button
								>
							{/each}
							{#if ri === 2}<button class="key wide" onclick={backspace}>⌫</button>{/if}
						</div>
					{/each}
				</div>
			</div>

			<div class="w-full grid grid-cols-[repeat(auto-fill,minmax(128px,1fr))] gap-4">
				{@render opponents(othersSecondHalf)}
			</div>
		</div>
	</div>

	<div class="eliminated-banner" class:show={showEliminated}>
		<div style="font-family:var(--font-display);font-size:38px;color:var(--red)">💀 ELIMINATED</div>
		<div style="color:var(--ink-dim);font-family:var(--font-mono)">
			Placed #{gameState.players.length - gameState.aliveCount + 1}/{gameState.players.length}
		</div>
		<button class="btn btn-ghost" onclick={() => (showEliminated = false)}
			>Spectate the rest →</button
		>
	</div>
</section>

{#snippet opponents(list: SquabblePlayer[])}
	{#each list as p, i (i)}
		{@const hpPct = Math.max(0, p.hp)}
		<div class="flex flex-col gap-1 ltr" class:dead={p.eliminated}>
			<div class="flex gap-1">
				<div class="size-8 border-2 border-border">
					<img class="size-full" src={p.avatar} alt="{p.name} avatar" />
				</div>
				<div class="flex flex-col gap-1 flex-1">
					<div
						class="text-xs font-bold whitespace-nowrap overflow-hidden text-ellipsis flex gap-2 items-baseline"
					>
						{p.name}
						{#if p.eliminated}<span class="skull">💀</span>{/if}
					</div>
					<div
						class="w-full h-2 bg-surface-2 rounded-full overflow-hidden border-border border relative"
					>
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
					{@const guess = p.guesses[rowIdx]}
					{#each Array(WORD_LEN) as _, colIdx (colIdx)}
						{@const cellIdx = rowIdx * WORD_LEN + colIdx}
						{@const result = guess
							? evaluateGuess(guess, gameState.words[p.wordIndex])[colIdx]
							: null}
						{@const garbage = p.miniGrid[cellIdx]}
						<div
							class="w-full aspect-square rounded-xs"
							class:bg-surface-2={!result && !garbage}
							class:bg-green={result === 'correct' && !garbage}
							class:bg-yellow={result === 'present' && !garbage}
							class:bg-gray-tile={result === 'absent' && !garbage}
							class:bg-surface-3={garbage}
						></div>
					{/each}
				{/each}
			</div>
		</div>
	{/each}
{/snippet}

<style>
	.tile {
		width: 64px;
		height: 64px;
		border: 2px solid var(--border);
		border-radius: 2px;
		background: var(--bg-2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 26px;
		text-transform: uppercase;
		color: var(--ink);
		transition: border-color 0.1s;
	}

	.tile.filled {
		border-color: var(--surface-3);
		animation: pop 0.12s ease;
	}

	@keyframes pop {
		0% {
			transform: scale(1.06);
		}
		100% {
			transform: scale(1);
		}
	}

	.tile.correct {
		background: var(--green);
		border-color: var(--green);
		color: #0e1a0d;
	}

	.tile.present {
		background: var(--yellow);
		border-color: var(--yellow);
		color: #1a1606;
	}

	.tile.absent {
		background: var(--gray-tile);
		border-color: var(--gray-tile);
		color: #fff;
	}

	.tile.flip {
		animation: flipTile 0.5s ease;
	}

	@keyframes flipTile {
		0% {
			transform: rotateX(0);
		}
		50% {
			transform: rotateX(90deg);
		}
		100% {
			transform: rotateX(0);
		}
	}

	.tile.locked {
		background: var(--surface-3);
		border-color: var(--ink-faint);
		color: var(--ink-faint);
	}

	.shake {
		animation: shakeRow 0.4s ease;
	}

	@keyframes shakeRow {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-8px);
		}
		40% {
			transform: translateX(8px);
		}
		60% {
			transform: translateX(-6px);
		}
		80% {
			transform: translateX(6px);
		}
	}

	/* KEY */

	.key {
		flex: 1;
		flex-shrink: 0;
		max-width: 42px;
		width: 42px;
		height: 50px;
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 13px;
		text-transform: uppercase;
		color: var(--ink);
		transition:
			transform 0.08s,
			background 0.15s;
	}

	.key:active {
		transform: scale(0.92);
	}

	.key.wide {
		max-width: 64px;
		font-size: 11px;
	}

	.key.correct {
		background: var(--green);
		color: #0e1a0d;
		border-color: var(--green);
	}

	.key.present {
		background: var(--yellow);
		color: #1a1606;
		border-color: var(--yellow);
	}

	.key.absent {
		background: var(--surface-3);
		color: var(--ink-faint);
		border-color: var(--surface-3);
		opacity: 0.5;
	}
</style>
