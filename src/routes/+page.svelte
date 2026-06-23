<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { makeRoomCode } from '$lib/game';
	import TitleFrame from '../lib/components/TitleFrame.svelte';

	let roomInput = $state('');

	function createRoom() {
		const code = makeRoomCode();
		goto(resolve(`/room/${code}`));
	}

	function joinRoom() {
		const code = roomInput
			.trim()
			.toUpperCase()
			.replace(/[^A-Z]/g, '')
			.slice(0, 8);
		if (!code) return;
		goto(resolve(`/room/${code}`));
	}
</script>

<svelte:head>
	<title>Perspective Party</title>
	<meta name="description" content="A Jackbox-like spatial reasoning drawing game." />
</svelte:head>

<TitleFrame>
	<div class="mt-6 flex gap-4 flex-col text-center items-center">
		<button class="btn coral text-xl" onclick={createRoom}>create room ▶</button>
		<div class="flex gap-4">
			<input
				type="text"
				placeholder="ROOM"
				autocorrect="off"
				autocapitalize="off"
				autocomplete="off"
				class="uppercase"
				bind:value={roomInput}
				onkeydown={(event) => event.key === 'Enter' && joinRoom()}
			/>
			<button class="btn sky" onclick={joinRoom}>join</button>
		</div>
	</div>
</TitleFrame>
