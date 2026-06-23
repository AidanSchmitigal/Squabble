<script lang="ts">
	import { onMount } from 'svelte';
	import QRCode from 'qrcode';
	import { SvelteURL } from 'svelte/reactivity';
	import { roomState } from '$lib/room.svelte';
	import TitleFrame from '$lib/components/TitleFrame.svelte';

	let gameState = $derived(roomState.gameState);

	let playerCount: number = $derived(gameState.players.length);

	let showGrid = $derived(gameState.settings.showGrid);
	let randomRotations = $derived(gameState.settings.randomRotations);

	let qrDataUrl: string | null = $state(null);

	onMount(() => {
		if (qrDataUrl) return;
		const url = new SvelteURL(window.location.href);
		url.search = '';

		QRCode.toDataURL(url.toString(), {
			width: 240,
			margin: 1,
			color: { dark: '#3a332c', light: '#fffef9' }
		}).then((url) => {
			qrDataUrl = url;
		});
	});

	function toggleGrid() {
		roomState.send({ type: 'update-settings', settings: { showGrid: !showGrid } });
	}

	function toggleRandomRotations() {
		roomState.send({ type: 'update-settings', settings: { randomRotations: !randomRotations } });
	}

	function startGame() {
		if (!gameState.players.length) return;
		roomState.send({ type: 'phase', phase: 'study' });
	}
</script>

<TitleFrame>
	<p class="mb-4 text-lg text-center">grab your phone and join the room</p>
	<div class="flex gap-4 justify-center">
		<div class="bg-coral ink px-8 py-4 inline-block -rotate-2">
			<div class="text-sm font-bold mb-0.5">room code</div>
			<div class="font-title text-5xl font-black text-ink tracking-widest leading-normal">
				{gameState.roomCode}
			</div>
		</div>
		{#if qrDataUrl}
			<img class="size-36 ink rotate-2" src={qrDataUrl} alt="QR code to join room" />
		{:else}
			<div class="waiting-text"></div>
		{/if}
	</div>

	<h3 style="margin: 22px 0 0; text-align: center">
		{playerCount} doodlers in the room
	</h3>
	<div class="mx-auto grid grid-cols-[repeat(auto-fill,minmax(86px,1fr))] gap-4 mt-4.5 max-w-lg">
		{#each gameState.players as player, i (player.name)}
			<div class="flex flex-col items-center">
				<div
					class="size-14 ink-sm relative flex items-center justify-center text-2xl shrink-0 overflow-clip {[
						'blob1',
						'blob2',
						'blob3'
					][i % 3]} {!player.connected && 'border-dashed'}"
				>
					{#if !player.connected}
						<div class="bg-white flex items-center text-2xl justify-center">…</div>
					{:else if player.avatar.drawing}
						<img src={player.avatar.drawing} alt={`${player.name}'s drawing`} />
					{:else}
						<div class="size-full bg-white"></div>
					{/if}
				</div>
				<div
					class="text-sm text-center mt-1 font-bold color-ink max-w-16 overflow-hidden text-ellipsis whitespace-nowrap"
				>
					{player.connected ? player.name : 'joining'}
				</div>
			</div>
		{/each}
		{#if gameState.players.length === 0}
			<div class="flex flex-col items-center col-span-full">
				<div
					class="size-14 ink-sm relative flex items-center justify-center text-2xl shrink-0 overflow-clip blob1 border-dashed"
				>
					<div class="bg-white flex items-center text-2xl justify-center">…</div>
				</div>
				<div class="text-sm text-center mt-1 font-bold color-ink whitespace-nowrap">
					no players yet
				</div>
			</div>
		{/if}
	</div>

	<div class="flex gap-6 justify-center mt-5">
		<label class="flex items-center gap-2 cursor-pointer">
			<button
				class="size-8 rounded-lg border-3 border-ink flex items-center justify-center text-lg font-bold transition-colors"
				class:bg-coral={showGrid}
				class:bg-white={!showGrid}
				class:text-white={showGrid}
				class:text-ink={!showGrid}
				onclick={toggleGrid}>{showGrid ? '✓' : ''}</button
			>
			<span class="font-title font-bold text-lg">3D Grid</span>
		</label>
		<label class="flex items-center gap-2 cursor-pointer">
			<button
				class="size-8 rounded-lg border-3 border-ink flex items-center justify-center text-lg font-bold transition-colors"
				class:bg-coral={randomRotations}
				class:bg-white={!randomRotations}
				class:text-white={randomRotations}
				class:text-ink={!randomRotations}
				onclick={toggleRandomRotations}>{randomRotations ? '✓' : ''}</button
			>
			<span class="font-title font-bold text-lg">Random Rotations</span>
		</label>
	</div>

	<div style="text-align: center; margin-top: 24px">
		<button
			class="btn coral text-xl disabled:grayscale"
			disabled={!gameState.players.length}
			onclick={startGame}>start game ▶</button
		>
	</div>
</TitleFrame>
