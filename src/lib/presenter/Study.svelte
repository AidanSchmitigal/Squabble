<script lang="ts">
	import PresenterScene from '$lib/components/PresenterScene.svelte';
	import { ROUND_COUNT, STUDY_DURATION, getTimeRemaining } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let display = $derived(getTimeRemaining('study', roomState.gameState.phaseStartedAt, now));

	$effect(() => {
		if (roomState.gameState.phase !== 'study') return;
		const elapsed = now - roomState.gameState.phaseStartedAt;
		if (elapsed >= STUDY_DURATION * 1000) {
			roomState.send({ type: 'phase', phase: 'draw' });
		}
	});
</script>

<div class="frame">
	<div
		class="absolute z-10 -top-3 -right-3 bg-white ink py-1.5 px-4 font-title font-bold text-xl rotate-3"
	>
		{roomState.gameState.round} / {ROUND_COUNT}
	</div>

	<div class="text-center font-title text-2xl font-bold mt-4 mb-2">Watch the shape!</div>
	<div
		class="h-80 flex items-center justify-center border-3 border-dashed border-ink rounded-2xl relative overlfow-clip stripes max-w-lg mx-auto"
	>
		<div
			class="absolute z-10 top-3 right-3 bg-white ink py-1.5 px-4 font-title font-bold text-xl rotate-3"
		>
			{display}
		</div>
		<PresenterScene />
	</div>
	<div class="flex gap-2.5 mt-4 flex-wrap pt-1.5 px-1 max-w-lg mx-auto">
		{#each roomState.gameState.players as player, i (player.id)}
			<div class="shrink-0 flex flex-col items-center">
				<div
					class="size-14 ink-sm relative flex items-center justify-center text-2xl shrink-0 overflow-clip {[
						'blob1',
						'blob2',
						'blob3'
					][i % 3]}"
				>
					{#if player.avatar.drawing}
						<img src={player.avatar.drawing} alt={`${player.name}'s drawing`} />
					{:else}
						<div class="size-full bg-white"></div>
					{/if}
				</div>
				<div class="">
					{player.name}
				</div>
			</div>
		{/each}
	</div>
</div>
