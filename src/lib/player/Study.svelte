<script lang="ts">
	import { getTimeRemaining } from '$lib/game';
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
</script>

<div class="frame max-w-lg">
	<div class="w-18 h-2 bg-ink rounded mx-auto mb-2"></div>
	<div class="text-center text-2xl font-title">Watch the shape!</div>
	<div class="bg-white w-fit mx-auto ink py-1.5 px-4 font-title font-bold text-xl">
		{display}
	</div>
</div>
