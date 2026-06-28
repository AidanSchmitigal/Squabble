<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import AvatarEditor from '$lib/components/AvatarEditor.svelte';
	import { EMPTY_AVATAR, sanitizeName, type Avatar, type GameState } from '$lib/game';
	import { getAvatar, getName, setAvatar, setName } from '$lib/storage';
	import { roomState } from '$lib/room.svelte';
	import { clickFeedback } from '$lib/feedback.svelte';
	import QRCode from 'qrcode';
	import { onMount } from 'svelte';
	import { SvelteURL } from 'svelte/reactivity';

	let { gameState, selfId }: { gameState: GameState; selfId: string } = $props();

	let me = $derived(gameState.players.find((p) => p.id === selfId));

	let qrDataUrl: string | null = $state(null);
	let lobbyName = $state('');
	let myLobbyAvatar: Avatar = $state(EMPTY_AVATAR);

	onMount(() => {
		if (qrDataUrl) return;
		const url = new SvelteURL(window.location.href);
		url.search = '';

		QRCode.toDataURL(url.toString(), {
			width: 240,
			margin: 1,
			color: { dark: '#0e0e10', light: '#f4f4f2' }
		}).then((url) => {
			qrDataUrl = url;
		});

		const storedAvatar = getAvatar();
		if (storedAvatar) myLobbyAvatar = storedAvatar;

		const storedName = sanitizeName(getName() || 'Player');
		if (storedName) lobbyName = storedName;

		roomState.send({ type: 'join', name: lobbyName, avatar: myLobbyAvatar });
	});

	$effect(() => {
		if (me) {
			lobbyName = me.name;
			if (!myLobbyAvatar) myLobbyAvatar = me.avatar.slice();
		}
	});

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
</script>

<section class="screen">
	<button class="absolute top-2 left-3 text-xs font-mono text-ink-dim" onclick={leaveLobby} use:clickFeedback
		>← <span class="underline">Leave lobby</span></button
	>

	<div class="w-full flex flex-col justify-center items-center flex-1 gap-5 pt-8">
		<div class="flex justify-between items-start gap-5 flex-wrap w-full max-w-xl">
			<div class="flex items-center gap-5">
				<div class="flex flex-col gap-2">
					<span class="font-mono pl-1 text-xs tracking-widerest uppercase text-ink-faint block"
						>Room code &middot; tap to copy</span
					>
					<button
						class="font-mono text-8xl font-bold tracking-widerest bg-surface-2 border-2 border-border rounded-sm py-2 px-5 text-yellow cursor-pointer transition-[border,transform] duration-700 hover:border-yellow rotate-x-360 active:rotate-x-0 active:duration-0"
						onclick={copyCode}
						tabindex="0"
						use:clickFeedback
					>
						<span class="drop-shadow-yellow-deep drop-shadow-[0_5px_0px_rgb(0_0_0/0.15)]"
							>{gameState.roomCode}</span
						>
					</button>
					<div class="flex gap-5 pl-1 font-mono text-xs text-ink-dim">
						<span> <span class="text-ink">{gameState.players.length}</span>/99 players</span>
					</div>
				</div>
				{#if qrDataUrl}
					<img class="bg-white rounded-sm p-2 size-40" src={qrDataUrl} alt="QR code to join room" />
				{/if}
			</div>
		</div>

		<hr />
		<div class="w-full max-w-xl">
			<span class="font-mono pl-1 text-xs tracking-widerest uppercase text-ink-faint block mb-2"
				>Customize your fighter</span
			>
			<AvatarEditor
				initialDrawing={myLobbyAvatar}
				oninstant={(avatar) => {
					myLobbyAvatar = avatar;
					roomState.send({ type: 'set-player', avatar });
				}}
				onupdate={(avatar) => {
					myLobbyAvatar = avatar;
					setAvatar(avatar);
					roomState.send({ type: 'set-player', avatar });
				}}
			>
				<input
					type="text"
					class="bg-surface border-2 border-border rounded-sm py-2 px-4 w-full"
					id="lobbyNameInput"
					placeholder="Your name"
					maxlength="14"
					style="margin-top:4px"
					bind:value={lobbyName}
					oninput={() => {
						setName(lobbyName);
						roomState.send({ type: 'set-player', name: lobbyName });
					}}
				/>
			</AvatarEditor>
		</div>
		<hr />

		<div class="w-full max-w-xl">
			<span class="font-mono pl-1 text-xs tracking-widerest uppercase text-ink-faint block mb-2"
				>Players</span
			>
			<div class="grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-3">
				{#each gameState.players as p (p.id)}
					<div class="flex flex-col gap-1 animate-fadeup items-center p-2">
						<div class="size-14 border-border border-2 bg-white relative">
							{#if p.isHost}<div
									class="absolute -top-4 -right-2 text-xl rotate-15 invert drop-shadow-sm drop-shadow-neutral-600"
								>
									🎩
								</div>{/if}
							<img class="size-full" src={p.avatar} alt="{p.name} avatar" />
						</div>
						<div class="text-sm font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-32">
							{p.name}
						</div>
					</div>
				{/each}
				<div class="flex flex-col gap-1 animate-fadeup items-center p-4">
					<div class="size-10 border-border border-2 border-dashed bg-surface/50 relative"></div>
					<div
						class="text-sm font-bold overflow-hidden text-ellipsis whitespace-nowrap max-w-32 text-ink-faint"
					>
						...
					</div>
				</div>
			</div>
		</div>

		{#if me?.isHost}
			<hr />
			<button class="btn btn-primary btn-block w-full max-w-xl" onclick={handleStartGame} use:clickFeedback
				>Start Game ▶</button
			>
		{/if}
	</div>
</section>
