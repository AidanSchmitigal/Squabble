<script lang="ts">
	import { roomState } from '$lib/room.svelte';
	import {
		evaluateGuess,
		ALLOWED_5,
		type SquabblePlayer,
		type TileResult,
		type Avatar,
		type GameSettings
	} from '$lib/game';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	const PALETTE = [
		'#ffffff',
		'#0e0e10',
		'#e5484d',
		'#5ab552',
		'#d7b740',
		'#8235f5',
		'#3a86ff',
		'#f2a65a',
		'#a85bd6',
		'#5e5e64'
	];

	let gameState = $derived(roomState.gameState);
	let phase = $derived(gameState.phase);
	let selfId = $derived(roomState.selfId);

	let me = $derived(gameState.players.find((p) => p.id === selfId));
	let others = $derived(gameState.players.filter((p) => p.id !== selfId));

	/* ---------- Custom actions for canvas drawing ---------- */
	function drawAvatar(node: HTMLCanvasElement, data: Avatar) {
		const size = 10;
		node.width = size;
		node.height = size;
		const ctx = node.getContext('2d')!;
		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, size, size);
		if (!data) return;
		for (let i = 0; i < size * size; i++) {
			const c = data[i];
			if (c) {
				ctx.fillStyle = c;
				ctx.fillRect(i % size, Math.floor(i / size), 1, 1);
			}
		}
		return {
			update(newData: Avatar) {
				drawAvatar(node, newData);
			}
		};
	}

	function drawQR(node: HTMLCanvasElement, text: string) {
		const N = 21;
		node.width = N * 4;
		node.height = N * 4;
		const ctx = node.getContext('2d')!;
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, 0, node.width, node.height);
		let seed = 0;
		for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
		function rnd() {
			seed = (seed * 1103515245 + 12345) >>> 0;
			return (seed >>> 16) / 65535;
		}
		ctx.fillStyle = '#111';
		for (let y = 0; y < N; y++) {
			for (let x = 0; x < N; x++) {
				const inFinder = (x < 6 && y < 6) || (x > N - 7 && y < 6) || (x < 6 && y > N - 7);
				if (inFinder) continue;
				if (rnd() < 0.46) ctx.fillRect(x * 4, y * 4, 4, 4);
			}
		}
		[
			[0, 0],
			[N - 7, 0],
			[0, N - 7]
		].forEach(([fx, fy]) => {
			ctx.fillStyle = '#111';
			ctx.fillRect(fx * 4, fy * 4, 28, 28);
			ctx.fillStyle = '#fff';
			ctx.fillRect((fx + 1) * 4, (fy + 1) * 4, 20, 20);
			ctx.fillStyle = '#111';
			ctx.fillRect((fx + 2) * 4, (fy + 2) * 4, 12, 12);
		});
	}

	/* ---------- Lifecycle ---------- */
	onMount(() => {
		initBgTiles();
	});

	function initBgTiles() {
		const wrap = document.getElementById('bgTiles');
		if (!wrap || wrap.children.length > 0) return;
		const letters = 'SQUABBLEWORDLE'.split('');
		const colors = ['var(--green)', 'var(--yellow)', 'var(--gray-tile)'];
		for (let i = 0; i < 22; i++) {
			const t = document.createElement('div');
			t.className = 'falling-tile';
			t.textContent = letters[Math.floor(Math.random() * letters.length)];
			t.style.left = Math.random() * 100 + 'vw';
			t.style.background = colors[Math.floor(Math.random() * colors.length)];
			t.style.animationDuration = 14 + Math.random() * 16 + 's';
			t.style.animationDelay = -Math.random() * 20 + 's';
			t.style.fontSize = 12 + Math.random() * 10 + 'px';
			wrap.appendChild(t);
		}
	}

	/* ================================================================
	   LOBBY
	   ================================================================ */

	let lobbyName = $state('');
	let myLobbyAvatar: Avatar | null = $state(null);

	$effect(() => {
		if (phase === 'lobby' && me) {
			lobbyName = me.name;
			if (!myLobbyAvatar) myLobbyAvatar = me.avatar.slice();
		}
	});

	function joinGame() {
		roomState.send({
			type: 'join',
			name: lobbyName || 'Player',
			avatar: myLobbyAvatar || new Array(100).fill(null)
		});
	}

	function handleStartGame() {
		roomState.send({ type: 'start-game' });
	}

	function leaveLobby() {
		roomState.disconnect();
		goto(resolve('/'));
	}

	function copyCode() {
		navigator.clipboard?.writeText(gameState.roomCode).catch(() => {});
	}

	/* ---------- Lobby avatar editor ---------- */
	function initLobbyEditor() {
		const canvas = document.getElementById('lobbyAvatarCanvas') as HTMLCanvasElement | null;
		const paletteEl = document.getElementById('lobbyPalette');
		if (!canvas || !paletteEl) return;

		const GRID = 10;
		const ctx = canvas.getContext('2d')!;
		let current = myLobbyAvatar?.slice() || new Array(GRID * GRID).fill(null);
		let activeColor = PALETTE[3];
		let erasing = false;

		function render() {
			ctx.clearRect(0, 0, GRID, GRID);
			ctx.fillStyle = '#ffffff';
			ctx.fillRect(0, 0, GRID, GRID);
			for (let i = 0; i < GRID * GRID; i++) {
				const c = current[i];
				if (c) {
					ctx.fillStyle = c;
					ctx.fillRect(i % GRID, Math.floor(i / GRID), 1, 1);
				}
			}
			myLobbyAvatar = current.slice();
		}

		canvas.width = GRID;
		canvas.height = GRID;
		render();

		function paintAt(clientX: number, clientY: number) {
			const rect = canvas!.getBoundingClientRect();
			const x = Math.floor(((clientX - rect.left) / rect.width) * GRID);
			const y = Math.floor(((clientY - rect.top) / rect.height) * GRID);
			if (x < 0 || y < 0 || x >= GRID || y >= GRID) return;
			const idx = y * GRID + x;
			current[idx] = erasing ? null : activeColor;
			render();
		}

		let painting = false;
		canvas.addEventListener('mousedown', (e) => {
			painting = true;
			paintAt(e.clientX, e.clientY);
		});
		window.addEventListener('mouseup', () => {
			painting = false;
		});
		canvas.addEventListener('mousemove', (e) => {
			if (painting) paintAt(e.clientX, e.clientY);
		});
		canvas.addEventListener(
			'touchstart',
			(e) => {
				painting = true;
				const t = e.touches[0];
				paintAt(t.clientX, t.clientY);
				e.preventDefault();
			},
			{ passive: false }
		);
		canvas.addEventListener(
			'touchmove',
			(e) => {
				if (painting) {
					const t = e.touches[0];
					paintAt(t.clientX, t.clientY);
				}
				e.preventDefault();
			},
			{ passive: false }
		);
		canvas.addEventListener('touchend', () => {
			painting = false;
		});

		paletteEl.innerHTML = '';
		PALETTE.forEach((c) => {
			const sw = document.createElement('div');
			sw.className = 'swatch';
			sw.style.background = c;
			if (c === activeColor) sw.classList.add('active');
			sw.addEventListener('click', () => {
				erasing = false;
				activeColor = c;
				[...paletteEl.children].forEach((s) => s.classList.remove('active'));
				sw.classList.add('active');
			});
			paletteEl.appendChild(sw);
		});

		const eraseSw = document.createElement('div');
		eraseSw.className = 'swatch erase';
		eraseSw.addEventListener('click', () => {
			erasing = true;
			[...paletteEl.children].forEach((s) => s.classList.remove('active'));
			eraseSw.classList.add('active');
		});
		paletteEl.appendChild(eraseSw);

		const clearBtn = document.getElementById('lobbyClearAvatar');
		if (clearBtn)
			clearBtn.onclick = () => {
				current = new Array(GRID * GRID).fill(null);
				render();
			};
		const randomBtn = document.getElementById('lobbyRandomAvatar');
		if (randomBtn)
			randomBtn.onclick = () => {
				current = current.map(() =>
					Math.random() < 0.55 ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : null
				);
				render();
			};
	}

	$effect(() => {
		if (phase === 'lobby') {
			requestAnimationFrame(() => initLobbyEditor());
		}
	});

	/* ---------- Lobby settings (host only) ---------- */
	let localSettings: GameSettings | null = $state(null);

	$effect(() => {
		if (phase === 'lobby') {
			localSettings = { ...gameState.settings };
		}
	});

	function updateSetting(key: keyof GameSettings, value: unknown) {
		if (!localSettings) return;
		localSettings = { ...localSettings, [key]: value };
		roomState.send({
			type: 'update-settings',
			settings: { [key]: value } as Partial<GameSettings>
		});
	}

	/* ================================================================
	   GAME VIEW
	   ================================================================ */

	let currentGuess = $state('');
	let shakeRow: number | null = $state(null);
	let showEliminated = $state(false);

	const KB_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

	let keyStates = $derived(me?.keyStates || {});

	function typeLetter(ch: string) {
		if (!me || me.eliminated) return;
		const wordLen = gameState.settings.wordLen;
		if (currentGuess.length >= wordLen) return;
		currentGuess += ch;
	}

	function backspace() {
		if (!me || me.eliminated) return;
		currentGuess = currentGuess.slice(0, -1);
	}

	function submitGuess() {
		if (!me || me.eliminated) return;
		if (currentGuess.length < gameState.settings.wordLen) {
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
		if (phase !== 'playing') return;
		function handler(e: KeyboardEvent) {
			if (e.key === 'Enter') submitGuess();
			else if (e.key === 'Backspace') backspace();
			else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toUpperCase());
		}
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});

	/* ---------- Eliminated banner ---------- */
	$effect(() => {
		if (phase === 'playing' && me?.eliminated && !showEliminated) {
			showEliminated = true;
		}
		if (phase !== 'playing') showEliminated = false;
	});

	/* ---------- Results ---------- */
	function shareResult() {
		const badge = document.getElementById('placementBadge');
		const txt = badge ? `I placed ${badge.textContent} in Squabble!` : '';
		navigator.clipboard?.writeText(txt).catch(() => {});
		toastMsg('Result copied to clipboard');
	}

	function playAgain() {
		roomState.disconnect();
		goto(resolve(`/room/${gameState.roomCode}`));
	}

	function backToMain() {
		roomState.disconnect();
		goto(resolve('/'));
	}

	/* ---------- History ---------- */
	let history = $state<{ place: number; total: number; words: number; date: string }[]>([]);

	$effect(() => {
		if (phase === 'finished') {
			try {
				history = JSON.parse(localStorage.getItem('squabble_history') || '[]');
			} catch {
				history = [];
			}
		}
	});

	/* ---------- Helpers ---------- */
	function hpClass(hp: number) {
		if (hp <= 30) return 'low';
		if (hp <= 60) return 'mid';
		return '';
	}

	function toastMsg(msg: string) {
		const wrap = document.getElementById('toastWrap');
		if (!wrap) return;
		const el = document.createElement('div');
		el.className = 'toast';
		el.textContent = msg;
		wrap.appendChild(el);
		setTimeout(() => el.remove(), 2800);
	}
</script>

<!-- ============================== LOBBY ============================== -->
{#if phase === 'lobby'}
	<section class="screen" id="screen-lobby">
		<div class="lobby-wrap">
			<div class="lobby-top">
				<div class="card code-card">
					<div class="code-block">
						<span class="section-label">Room code &middot; tap to copy</span>
						<div class="code-display" onclick={copyCode}>{gameState.roomCode}</div>
						<div class="lobby-meta">
							<span><b>{gameState.players.length}</b>/{gameState.settings.maxPlayers} players</span>
							<span>{gameState.settings.mode}</span>
						</div>
					</div>
					<canvas
						class="qr-canvas"
						id="qrCanvas"
						width="92"
						height="92"
						use:drawQR={'https://squabble.me/join/' + gameState.roomCode}
					></canvas>
				</div>
			</div>

			<div class="lobby-grid">
				<div class="card">
					<span class="section-label">Players</span>
					<div class="player-list">
						{#each gameState.players as p}
							<div class="player-chip">
								{#if p.isHost}<div class="host-crown">👑</div>{/if}
								<div class="avatar-frame"><canvas use:drawAvatar={p.avatar}></canvas></div>
								<div class="pname">{p.name}</div>
								<div class="ptag">{p.id === selfId ? 'YOU' : 'PLAYER'}</div>
							</div>
						{/each}
					</div>
				</div>

				{#if me?.isHost}
					<div class="card">
						<span class="section-label"
							>Game settings <span style="color:var(--ink-faint);font-weight:500">(host only)</span
							></span
						>
						<div class="settings-panel">
							<div class="setting-row">
								<label>Mode</label>
								<div class="seg-control">
									<button
										class:active={localSettings?.mode === 'Blitz'}
										onclick={() => updateSetting('mode', 'Blitz')}>Blitz</button
									>
									<button
										class:active={localSettings?.mode === 'Royale'}
										onclick={() => updateSetting('mode', 'Royale')}>Royale</button
									>
								</div>
							</div>
							<div class="setting-row">
								<label>Word length</label>
								<select
									class="select-pill"
									value={localSettings?.wordLen ?? 5}
									onchange={(e) =>
										updateSetting('wordLen', parseInt((e.target as HTMLSelectElement).value))}
								>
									<option value="4">4 letters</option>
									<option value="5">5 letters</option>
									<option value="6">6 letters</option>
								</select>
							</div>
							<div class="setting-row">
								<label>Word list</label>
								<select
									class="select-pill"
									value={localSettings?.wordList ?? 'common'}
									onchange={(e) => updateSetting('wordList', (e.target as HTMLSelectElement).value)}
								>
									<option value="common">Common</option>
									<option value="expanded">Expanded</option>
									<option value="spicy">🌶️ Spicy / Obscure</option>
								</select>
							</div>
							<div class="setting-row">
								<label>Damage tick</label>
								<input
									type="range"
									min="1"
									max="5"
									value={localSettings?.dmgTick ?? 1}
									class="range-pill"
									oninput={(e) =>
										updateSetting('dmgTick', parseInt((e.target as HTMLInputElement).value))}
								/>
							</div>
							<div class="setting-row">
								<label>Max players</label>
								<select
									class="select-pill"
									value={localSettings?.maxPlayers ?? 99}
									onchange={(e) =>
										updateSetting('maxPlayers', parseInt((e.target as HTMLSelectElement).value))}
								>
									<option value="8">8</option>
									<option value="20">20</option>
									<option value="50">50</option>
									<option value="99">99</option>
								</select>
							</div>
							<div class="setting-row">
								<label>Private room</label>
								<button
									class="pref-toggle"
									style="padding:6px 10px"
									onclick={() => updateSetting('private', !localSettings?.private)}
								>
									<span class="switch" class:on={localSettings?.private ?? false}></span>
								</button>
							</div>
						</div>
						<button
							class="btn btn-primary btn-block"
							onclick={handleStartGame}
							style="margin-top:16px">Start Game ▶</button
						>
					</div>
				{/if}
			</div>

			<div class="card" style="width:100%">
				<span class="section-label">Customize your fighter</span>
				<div class="avatar-editor">
					<canvas id="lobbyAvatarCanvas" width="10" height="10"></canvas>
					<div class="palette" id="lobbyPalette"></div>
					<div class="avatar-tools">
						<button class="btn btn-ghost btn-sm" id="lobbyClearAvatar">Clear</button>
						<button class="btn btn-ghost btn-sm" id="lobbyRandomAvatar">🎲 Random</button>
						<input
							type="text"
							class="name-input"
							id="lobbyNameInput"
							placeholder="Your name"
							maxlength="14"
							style="margin-top:4px"
							bind:value={lobbyName}
							oninput={() => joinGame()}
						/>
					</div>
				</div>
			</div>

			<button class="btn btn-ghost" onclick={leaveLobby}>← Leave lobby</button>
		</div>
	</section>

	<!-- ============================== PLAYING ============================== -->
{:else if phase === 'playing'}
	<section class="screen" id="screen-game">
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
						{#each Array(6) as _, rowIdx}
							<div class="board-row" class:shake={shakeRow === rowIdx}>
								{#each Array(gameState.settings.wordLen) as _, colIdx}
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
						{#each KB_ROWS as row, ri}
							<div class="kb-row">
								{#if ri === 2}<button class="key wide" onclick={submitGuess}>ENTER</button>{/if}
								{#each row.split('') as ch}
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
					{#each others as p}
						{@const hpPct = Math.max(0, p.hp)}
						<div class="opp-card" class:dead={p.eliminated}>
							<div class="opp-avatar"><canvas use:drawAvatar={p.avatar}></canvas></div>
							<div class="opp-info">
								<div class="opp-name">
									{p.name}
									{#if p.eliminated}<span class="skull">💀</span>{/if}
								</div>
								<div class="opp-hp-track">
									<div class="opp-hp-fill {hpClass(hpPct)}" style="width:{hpPct}%"></div>
								</div>
								<div class="opp-mini-grid">
									{#each Array(15) as _, i}
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
			<div style="font-family:var(--font-display);font-size:38px;color:var(--red)">
				💀 ELIMINATED
			</div>
			<div style="color:var(--ink-dim);font-family:var(--font-mono)">
				Placed #{gameState.players.length - gameState.aliveCount + 1}/{gameState.players.length}
			</div>
			<button class="btn btn-ghost" onclick={() => (showEliminated = false)}
				>Spectate the rest →</button
			>
		</div>
	</section>

	<!-- ============================== FINISHED ============================== -->
{:else if phase === 'finished'}
	{@const placement = me?.placement ?? gameState.players.length}
	<section class="screen" id="screen-results">
		<div class="results-wrap">
			<div class="mini-logo">
				{#each 'SQUABBLE'.split('') as ch}
					<div class="mt">{ch}</div>
				{/each}
			</div>
			<div
				class="placement-badge"
				class:win={placement === 1}
				class:lose={placement !== 1}
				id="placementBadge"
			>
				#{placement}
			</div>
			<div style="font-family:var(--font-mono);color:var(--ink-dim);letter-spacing:0.05em">
				{placement === 1 ? 'VICTORY ROYALE' : `Out of ${gameState.players.length} fighters`}
			</div>

			<div class="stat-grid">
				<div class="stat-box">
					<div class="val">{me?.wordsSolved ?? 0}</div>
					<div class="lbl">Words solved</div>
				</div>
				<div class="stat-box">
					<div class="val">0</div>
					<div class="lbl">Damage dealt</div>
				</div>
				<div class="stat-box">
					<div class="val">0</div>
					<div class="lbl">Damage taken</div>
				</div>
				<div class="stat-box">
					<div class="val">{Math.floor(((me?.guesses.length ?? 0) * 30) / 1000)}s</div>
					<div class="lbl">Time survived</div>
				</div>
			</div>

			<div class="card" style="width:100%">
				<span class="section-label">Match history (saved locally)</span>
				<div class="history-list">
					{#if history.length === 0}
						<div style="color:var(--ink-faint);font-size:12px;text-align:center;padding:10px">
							No matches yet &mdash; play your first Squabble!
						</div>
					{:else}
						{#each history as h}
							<div class="history-row">
								<span>#{h.place} <span style="color:var(--ink-faint)">/ {h.total}</span></span>
								<span><b>{h.words}</b> words</span>
								<span>{new Date(h.date).toLocaleDateString()}</span>
							</div>
						{/each}
					{/if}
				</div>
			</div>

			<div class="cta-row" style="width:100%">
				<button class="btn btn-primary" onclick={playAgain}>↻ Play Again</button>
				<button class="btn btn-purple" onclick={shareResult}>📋 Copy result</button>
			</div>
			<button class="btn btn-ghost btn-block" onclick={backToMain}>Back to main menu</button>
		</div>
	</section>
{/if}
