<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import { evaluateGuess, ALLOWED_5, type GameState, WORD_LEN } from '$lib/game';
	import { hpClass } from '$lib';

	let { gameState, selfId }: { gameState: GameState; selfId: string } = $props();

	let me = $derived(gameState.players.find((p) => p.id === selfId));
	let others = $derived(gameState.players.filter((p) => p.id !== selfId));

	let currentGuess = $state('');
	let shakeRow: number | null = $state(null);
	let showEliminated = $state(false);

	const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
	let keyStates = $derived(me?.keyStates || {});

	function typeLetter(ch: string) {
		if (!me || me.eliminated) return;
		if (currentGuess.length >= WORD_LEN) return;
		currentGuess += ch;
	}

	function backspace() {
		if (!me || me.eliminated) return;
		currentGuess = currentGuess.slice(0, -1);
	}

	function submitGuess() {
		if (!me || me.eliminated) return;
		if (currentGuess.length < WORD_LEN) {
			shakeRow = me.guesses.length;
			setTimeout(() => (shakeRow = null), 400);
			return;
		}
		if (!ALLOWED_5.has(currentGuess)) {
			shakeRow = me.guesses.length;
			setTimeout(() => (shakeRow = null), 400);
			return;
		}
		roomState.send({ type: 'submit-guess', guess: currentGuess });
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
		if (me?.eliminated && !showEliminated) showEliminated = true;
	});
</script>

<section class="screen active" id="screen-game">
	<div class="game-wrap">
		<div class="game-topbar">
			<div class="word-progress">
				📜 Word <b>{me ? me.wordIndex + 1 : 1}</b> / {gameState.words.length}
			</div>
			<div class="hp-wrap">
				<span class="hp-label">HP</span>
				<div class="hp-bar-track">
					<div
						class="hp-bar-fill {hpClass(me?.hp ?? 100)}"
						style="width:{Math.max(0, me?.hp ?? 100)}%"
					></div>
				</div>
				<span class="hp-num">{Math.max(0, Math.round(me?.hp ?? 100))}</span>
			</div>
			<div class="rank-pill">{gameState.aliveCount} alive</div>
		</div>

		<div class="game-body">
			<div class="board-col">
				<div class="board">
					{#each Array(6) as _, rowIdx (rowIdx)}
						<div class="board-row" class:shake={shakeRow === rowIdx}>
							{#each Array(WORD_LEN) as _, colIdx (colIdx)}
								{@const guess = me?.guesses[rowIdx]}
								{@const letter = guess
									? guess[colIdx]
									: rowIdx === (me?.guesses.length ?? 0)
										? currentGuess[colIdx]
										: ''}
								{@const result = guess
									? evaluateGuess(guess, gameState.words[me?.wordIndex ?? 0])[colIdx]
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

				<div class="keyboard">
					{#each KB_ROWS as row, ri (ri)}
						<div class="kb-row">
							{#if ri === 2}<button class="key wide" onclick={submitGuess}>ENTER</button>{/if}
							{#each row.split('') as ch, i (i)}
								{@const st = keyStates[ch]}
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

			<div class="opp-col">
				{#each others as p (p.id)}
					{@const hpPct = Math.max(0, p.hp)}
					<div class="opp-card" class:dead={p.eliminated}>
						<div class="opp-avatar"><img src={p.avatar} alt="{p.name} avatar" /></div>
						<div class="opp-info">
							<div class="opp-name">
								{p.name}
								{#if p.eliminated}<span class="skull">💀</span>{/if}
							</div>
							<div class="opp-hp-track">
								<div class="opp-hp-fill {hpClass(hpPct)}" style="width:{hpPct}%"></div>
							</div>
							<div class="opp-mini-grid">
								{#each Array(15) as _, i (i)}
									<div class="opp-mini-cell" class:fill={p.miniGrid[i]}></div>
								{/each}
							</div>
						</div>
					</div>
				{/each}
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
