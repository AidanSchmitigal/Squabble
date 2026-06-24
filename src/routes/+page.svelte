<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import HeroLogo from '$lib/components/HeroLogo.svelte';
	import HowToPlay from '$lib/components/HowToPlay.svelte';
	import { makeRoomCode, makeAvatar, randomAvatar } from '$lib/game';
	import { onMount } from 'svelte';

	let roomInput = $state('');
	let showJoin = $state(false);

	/* ---------- Preferences ---------- */
	const PREFS_KEY = 'squabble_prefs';
	function loadPrefs() {
		try {
			return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
		} catch {
			return {};
		}
	}
	function savePrefs(data: Record<string, unknown>) {
		const merged = { ...loadPrefs(), ...data };
		localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
	}

	let prefs = $state(loadPrefs());
	let playerName = $state(prefs.name || '');
	let soundOn = $state(prefs.sound !== false);
	let cbOn = $state(!!prefs.cb);
	let myAvatar = $state<import('$lib/game').Avatar>(prefs.avatar || randomAvatar());

	onMount(() => {
		initBgTiles();
		document.body.classList.toggle('cb-mode', cbOn);
	});

	function persist() {
		savePrefs({ name: playerName, sound: soundOn, cb: cbOn, avatar: myAvatar });
	}

	function toggleSound() {
		soundOn = !soundOn;
		persist();
	}
	function toggleCB() {
		cbOn = !cbOn;
		document.body.classList.toggle('cb-mode', cbOn);
		persist();
	}

	function createRoom() {
		const code = makeRoomCode();
		persist();
		goto(resolve(`/room/${code}`));
	}

	function joinRoom() {
		const code = roomInput
			.trim()
			.toUpperCase()
			.replace(/[^A-Z]/g, '')
			.slice(0, 4);
		if (!code) return;
		persist();
		goto(resolve(`/room/${code}`));
	}

	/* ---------- Background tiles ---------- */
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
</script>

<svelte:head>
	<title>Squabble — Competitive Wordle</title>
	<meta name="description" content="Competitive Wordle battle royale." />
</svelte:head>

<section class="screen justify-center">
	<div class="main-wrap">
		<div class="flex flex-col gap-3 items-center mb-5">
			<HeroLogo />
			<div
				class="font-mono tracking-widest uppercase text-xs text-ink-dim opacity-0 animate-fadeup animation-delay-1100"
			>
				Competitive Wordle
			</div>
		</div>

		<div class="flex w-full gap-3 mt-4 justify-center">
			<button
				class="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-3 py-2 text-ink-dim font-bold text-xs"
				onclick={toggleSound}
			>
				<span class="switch" class:on={soundOn}></span> Sound
			</button>
			<button
				class="flex items-center gap-2 bg-surface-2 border border-border rounded-full px-3 py-2 text-ink-dim font-bold text-xs"
				onclick={toggleCB}
			>
				<span class="switch" class:on={cbOn}></span> Colorblind palette
			</button>
		</div>

		<div class="w-full">
			<div class="flex gap-3 w-full">
				<button class="flex-1 flex-col gap-1 rounded btn btn-primary" onclick={createRoom}>
					<span class="text-base">⚔️ Create Game</span>
					<span class="text-xs font-medium opacity-75 uppercase tracking-wider"
						>Host a new lobby</span
					>
				</button>
				<button
					class="flex-1 flex-col gap-1 rounded btn btn-purple"
					onclick={() => {
						showJoin = !showJoin;
					}}
				>
					<span class="text-base">🔑 Join with Code</span>
					<span class="text-xs font-medium opacity-75 uppercase tracking-wider"
						>Enter a room code</span
					>
				</button>
			</div>
			{#if showJoin}
				<div class="w-full gap-2 mt-3 flex animate-fadeup">
					<input
						type="text"
						id="joinCodeInput"
						autocomplete="off"
						autocorrect="off"
						autocapitalize="off"
						spellcheck="false"
						maxlength="4"
						class="flex-1 bg-surface-2 border-border border-2 rounded-sm text-ink font-mono text-xl tracking-[0.2em] text-center uppercase py-3 px-2 font-bold focus:border-yellow focus:outline-none"
						bind:value={roomInput}
						onkeydown={(e) => e.key === 'Enter' && joinRoom()}
					/>
					<button class="btn btn-purple mb-1.5" onclick={joinRoom}>Join</button>
				</div>{/if}
		</div>

		<HowToPlay />
	</div>
</section>
