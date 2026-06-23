<script lang="ts">
	import PresenterScene from '$lib/components/PresenterScene.svelte';
	import { DRAW_DURATION, getTimeRemaining, ROUND_COUNT } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let display = $derived(getTimeRemaining('draw', roomState.gameState.phaseStartedAt, now));

	let allPlayersDone = $derived(roomState.gameState.players.every((p) => p.done));

	$effect(() => {
		if (roomState.gameState.phase !== 'draw') return;
		const elapsed = now - roomState.gameState.phaseStartedAt;
		if (elapsed >= DRAW_DURATION * 1000 || allPlayersDone) {
			roomState.send({ type: 'phase', phase: 'reveal' });
		}
	});
</script>

<div class="frame">
	<div
		class="absolute z-10 -top-3 -right-3 bg-white ink py-1.5 px-4 font-title font-bold text-xl rotate-3"
	>
		{roomState.gameState.round} / {ROUND_COUNT}
	</div>

	<div class="text-center font-title text-2xl font-bold mt-4 mb-2">Draw the shape!</div>
	<div class="text-center font-title text-lg -mt-2 mb-2">
		from the <span class="text-2xl">{roomState.gameState.challenge.targetAngle}</span> side
	</div>
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
				<div class="relative">
					<div
						class="size-8 absolute -top-2 -left-2 border-3 border-ink flex items-center justify-center text-2xl shrink-0 overflow-clip {[
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
					<div class="size-16 ink-sm overflow-clip shrink-0">
						<img src={player.drawing} alt={`${player.name}'s drawing`} />
					</div>
				</div>
				<div class="bg-grass border-2 border-ink rounded-xl text-xs font-bold py-px px-1.5 mt-1">
					{player.done ? '✓ done' : 'drawing…'}
				</div>
			</div>
		{/each}
	</div>
</div>
