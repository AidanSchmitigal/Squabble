<script lang="ts">
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import { makeAvatar, sanitizeName, type Avatar } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let {
		autoJoin = false,
		onjoin = (_name: string, _avatar: Avatar) => {}
	}: {
		autoJoin?: boolean;
		onjoin?: (name: string, avatar: Avatar) => void;
	} = $props();

	let name = $state('');
	let avatar = $state<Avatar>(makeAvatar());

	let joined = $derived(
		roomState.selfId && roomState.gameState.players.some((p) => p.id === roomState.selfId)
	);

	onMount(() => {
		const cleanName = sanitizeName(localStorage.getItem('perspective-party-name') || '');
		name = cleanName;
		localStorage.setItem('perspective-party-name', cleanName);

		const storedAvatar = localStorage.getItem('perspective-party-avatar');
		if (storedAvatar) avatar = JSON.parse(storedAvatar) as Avatar;

		if (autoJoin) {
			roomState.send({ type: 'join', name, avatar });
		}
	});

	$effect(() => {
		localStorage.setItem('perspective-party-name', name);
		if (joined) {
			roomState.send({ type: 'set-player', name });
		}
	});
</script>

<div class="frame max-w-lg">
	<div class="w-18 h-2 bg-ink rounded mx-auto mb-2"></div>
	<div class="text-center">
		<h2 class="text-xl mt-1 mb-2">make your doodler</h2>

		<DrawingCanvas
			avatar
			initialDrawing={avatar.drawing}
			oninstant={(url) => {
				avatar.drawing = url;
				localStorage.setItem('perspective-party-avatar', JSON.stringify(avatar));
				if (joined) {
					roomState.send({ type: 'set-player', avatar });
				}
			}}
			onupdate={(url) => {
				avatar.drawing = url;
				localStorage.setItem('perspective-party-avatar', JSON.stringify(avatar));
				if (joined) {
					roomState.send({ type: 'set-player', avatar });
				}
			}}
		/>

		<div class="font-title font-bold mt-2 mb-1">name your doodler</div>
		<input type="text" id="ccName" placeholder="Lentil" maxlength="14" bind:value={name} />

		{#if !autoJoin}
			<button class="btn grass w-full text-lg mt-4" onclick={() => onjoin(name, avatar)}
				>Join Game</button
			>
		{/if}
	</div>
</div>
