<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { makeRoomCode, makeAvatar, randomAvatar } from '$lib/game';
	import { onMount } from 'svelte';

	const PALETTE = [
		'#ffffff', '#0e0e10', '#e5484d', '#5ab552',
		'#d7b740', '#8235f5', '#3a86ff', '#f2a65a', '#a85bd6', '#5e5e64'
	];

	let roomInput = $state('');
	let showJoin = $state(false);

	/* ---------- Preferences ---------- */
	const PREFS_KEY = 'squabble_prefs';
	function loadPrefs() {
		try {
			return JSON.parse(localStorage.getItem(PREFS_KEY) || '{}');
		} catch { return {}; }
	}
	function savePrefs(data: Record<string, unknown>) {
		const merged = { ...loadPrefs(), ...data };
		localStorage.setItem(PREFS_KEY, JSON.stringify(merged));
	}

	let prefs = $state(loadPrefs());
	let playerName = $state(prefs.name || '');
	let soundOn = $state(prefs.sound !== false);
	let cbOn = $state(!!prefs.cb);
	let motionOn = $state(!!prefs.motion);
	let myAvatar = $state<import('$lib/game').Avatar>(prefs.avatar || randomAvatar());

	onMount(() => {
		initBgTiles();
		buildHeroLogo();
		drawAvatarPreview(myAvatar);
		document.body.classList.toggle('cb-mode', cbOn);
		document.body.classList.toggle('reduced-motion', motionOn);
		initAvatarEditor();
	});

	function persist() {
		savePrefs({ name: playerName, sound: soundOn, cb: cbOn, motion: motionOn, avatar: myAvatar });
	}

	function setName(v: string) {
		playerName = v;
		persist();
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
	function toggleMotion() {
		motionOn = !motionOn;
		document.body.classList.toggle('reduced-motion', motionOn);
		persist();
	}

	function createRoom() {
		const code = makeRoomCode();
		persist();
		goto(resolve(`/room/${code}`));
	}

	function joinRoom() {
		const code = roomInput.trim().toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
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

	/* ---------- Hero logo ---------- */
	function buildHeroLogo() {
		const container = document.getElementById('heroLogo');
		if (!container) return;
		const word = 'SQUABBLE';
		const accentCycle = ['var(--gray-tile)', 'var(--yellow)', 'var(--green)'];
		container.innerHTML = '';
		word.split('').forEach((ch, i) => {
			const el = document.createElement('div');
			el.className = 'logo-tile';
			el.textContent = ch;
			el.style.setProperty('--i', String(i));
			const accent = accentCycle[i % accentCycle.length];
			el.style.setProperty('--accent-bg', accent);
			el.style.setProperty('--accent-color', accent);
			el.style.color = accent === 'var(--yellow)' ? '#1a1606' : accent === 'var(--green)' ? '#0e1a0d' : '#fff';
			container.appendChild(el);
		});
	}

	/* ---------- Avatar ---------- */
	function drawAvatarPreview(data: import('$lib/game').Avatar) {
		const canvas = document.getElementById('mainAvatarPreview') as HTMLCanvasElement | null;
		if (!canvas) return;
		const size = 10;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
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
	}

	function initAvatarEditor() {
		const canvas = document.getElementById('avatarCanvas') as HTMLCanvasElement | null;
		const palette = document.getElementById('palette');
		if (!canvas || !palette) return;

		const GRID = 10;
		const ctx = canvas.getContext('2d')!;
		let current = myAvatar.slice();
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
			myAvatar = current.slice();
			drawAvatarPreview(myAvatar);
			persist();
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
		canvas.addEventListener('mousedown', (e) => { painting = true; paintAt(e.clientX, e.clientY); });
		window.addEventListener('mouseup', () => { painting = false; });
		canvas.addEventListener('mousemove', (e) => { if (painting) paintAt(e.clientX, e.clientY); });
		canvas.addEventListener('touchstart', (e) => {
			painting = true;
			const t = e.touches[0];
			paintAt(t.clientX, t.clientY);
			e.preventDefault();
		}, { passive: false });
		canvas.addEventListener('touchmove', (e) => {
			if (painting) {
				const t = e.touches[0];
				paintAt(t.clientX, t.clientY);
			}
			e.preventDefault();
		}, { passive: false });
		canvas.addEventListener('touchend', () => { painting = false; });

		palette.innerHTML = '';
		PALETTE.forEach((c) => {
			const sw = document.createElement('div');
			sw.className = 'swatch';
			sw.style.background = c;
			if (c === activeColor) sw.classList.add('active');
			sw.addEventListener('click', () => {
				erasing = false;
				activeColor = c;
				[...palette.children].forEach((s) => s.classList.remove('active'));
				sw.classList.add('active');
			});
			palette.appendChild(sw);
		});

		const eraseSw = document.createElement('div');
		eraseSw.className = 'swatch erase';
		eraseSw.title = 'Eraser';
		eraseSw.addEventListener('click', () => {
			erasing = true;
			[...palette.children].forEach((s) => s.classList.remove('active'));
			eraseSw.classList.add('active');
		});
		palette.appendChild(eraseSw);

		document.getElementById('clearAvatarBtn')!.onclick = () => {
			current = new Array(GRID * GRID).fill(null);
			render();
		};
		document.getElementById('randomAvatarBtn')!.onclick = () => {
			current = current.map(() =>
				Math.random() < 0.55 ? PALETTE[Math.floor(Math.random() * PALETTE.length)] : null
			);
			render();
		};
	}

	/* ---------- Modals ---------- */
	function openModal(id: string) {
		document.getElementById(id)?.classList.add('show');
	}
	function closeModal(id: string) {
		document.getElementById(id)?.classList.remove('show');
	}

	function showHowTo() {
		openModal('howToModal');
	}
</script>

<svelte:head>
	<title>Squabble — Competitive Wordle</title>
	<meta name="description" content="Competitive Wordle battle royale." />
</svelte:head>

<section class="screen active" id="screen-main">
	<div class="main-wrap">
		<div class="hero">
			<div class="logo-row" id="heroLogo"></div>
			<div class="tag">Competitive Wordle &middot; Beta</div>
		</div>

		<div class="card profile-card">
			<span class="section-label">Your profile</span>
			<div class="profile-row">
				<div class="avatar-frame" style="width:54px;height:54px;border-radius:10px;border:2px solid var(--border);overflow:hidden;background:#fff;flex-shrink:0">
					<canvas id="mainAvatarPreview" width="10" height="10" style="width:100%;height:100%;image-rendering:pixelated"></canvas>
				</div>
				<input type="text" class="name-input" id="playerNameInput" placeholder="Choose a name" maxlength="14" value={playerName} oninput={(e) => setName((e.target as HTMLInputElement).value)} />
				<button class="icon-btn" onclick={() => openModal('avatarModal')} title="Draw your icon">✏️</button>
			</div>
			<div class="prefs-row">
				<button class="pref-toggle" onclick={toggleSound}>
					<span class="switch" class:on={soundOn}></span> Sound
				</button>
				<button class="pref-toggle" onclick={toggleCB}>
					<span class="switch" class:on={cbOn}></span> Colorblind palette
				</button>
				<button class="pref-toggle" onclick={toggleMotion}>
					<span class="switch" class:on={motionOn}></span> Reduce motion
				</button>
			</div>
		</div>

		<div class="card" style="width:100%">
			<span class="section-label">Play</span>
			<div class="cta-row">
				<button class="btn btn-primary" onclick={createRoom}>
					<span class="label">⚔️ Create Game</span>
					<span class="sub">Host a new lobby</span>
				</button>
				<button class="btn btn-purple" onclick={() => { showJoin = !showJoin; }}>
					<span class="label">🔑 Join with Code</span>
					<span class="sub">Enter a room code</span>
				</button>
			</div>
			<div class="join-box" class:show={showJoin} style="margin-top:12px">
				<input type="text" id="joinCodeInput" placeholder="ABCD" maxlength="4" bind:value={roomInput} onkeydown={(e) => e.key === 'Enter' && joinRoom()} />
				<button class="btn btn-purple btn-sm" onclick={joinRoom}>Join</button>
			</div>
		</div>

		<button class="btn btn-ghost btn-block" onclick={showHowTo}>📖 How to play</button>
	</div>
</section>

<!-- ====== AVATAR MODAL ====== -->
<div class="modal-overlay" id="avatarModal">
	<div class="modal">
		<div class="modal-head">
			<h2>Draw your icon</h2>
			<button class="icon-btn" onclick={() => closeModal('avatarModal')}>✕</button>
		</div>
		<div class="avatar-editor">
			<canvas id="avatarCanvas" width="10" height="10"></canvas>
			<div class="palette" id="palette"></div>
			<div class="avatar-tools">
				<button class="btn btn-ghost btn-sm" id="clearAvatarBtn">Clear</button>
				<button class="btn btn-ghost btn-sm" id="randomAvatarBtn">🎲 Random</button>
			</div>
		</div>
		<button class="btn btn-primary btn-block" onclick={() => closeModal('avatarModal')} style="margin-top:14px">Save icon</button>
	</div>
</div>

<!-- ====== HOW TO PLAY MODAL ====== -->
<div class="modal-overlay" id="howToModal">
	<div class="modal">
		<div class="modal-head">
			<h2>How to play</h2>
			<button class="icon-btn" onclick={() => closeModal('howToModal')}>✕</button>
		</div>
		<div class="howto-tile-row">
			<div class="howto-tile" style="background:var(--green);border-color:var(--green);color:#0e1a0d">C</div>
			<div class="howto-tile" style="background:var(--yellow);border-color:var(--yellow);color:#1a1606">R</div>
			<div class="howto-tile" style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff">A</div>
			<div class="howto-tile" style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff">N</div>
			<div class="howto-tile" style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff">E</div>
		</div>
		<div class="howto-step"><b>🟩 Green</b> &mdash; letter is correct &amp; in the right spot.</div>
		<div class="howto-step"><b>🟨 Yellow</b> &mdash; letter is in the word, wrong spot.</div>
		<div class="howto-step"><b>⬛ Gray</b> &mdash; letter isn't in the word at all.</div>
		<div class="howto-step">⏱️ You take <b>1 damage every second</b>, always. The clock never stops.</div>
		<div class="howto-step">✅ Solve the word to <b>heal</b> and <b>deal damage</b> to a random rival, sending them garbage.</div>
		<div class="howto-step">❌ A wrong guess costs you extra HP &mdash; guess carefully, but don't stall.</div>
		<div class="howto-step">🏆 Everyone shares the same word list. Last fighter standing wins the Squabble.</div>
		<button class="btn btn-primary btn-block" onclick={() => closeModal('howToModal')}>Got it</button>
	</div>
</div>
