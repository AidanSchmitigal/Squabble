<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Confetti from '$lib/components/Confetti.svelte';
	import { roomState } from '$lib/room.svelte';

	let sortedPlayers = $derived.by(() => {
		return [...roomState.gameState.players].sort((a, b) => b.score - a.score);
	});

	let myId = $derived(roomState.selfId);

	let myRank = $derived(sortedPlayers.findIndex((p) => p.id === myId) + 1);
	let myPlayer = $derived(sortedPlayers.find((p) => p.id === myId));

	function playAgain() {
		goto(resolve('/'));
	}
</script>

<div class="frame max-w-lg">
	<Confetti />
	<div class="w-18 h-2 bg-ink rounded mx-auto mb-6"></div>

	{#if myPlayer}
		<div class="text-center">
			<div class="font-title text-5xl mb-3">🏆</div>
			<div class="font-title text-2xl font-bold mb-1">
				You got <span class="text-coral"
					>{myRank}{myRank === 1 ? 'st' : myRank === 2 ? 'nd' : myRank === 3 ? 'rd' : 'th'}</span
				> place!
			</div>
			<div class="font-title text-xl font-bold text-ink/60 mb-6">Nice job!</div>
			<div class="font-title text-lg mb-2">
				Final score: <span class="text-xl">{myPlayer.score}</span>
			</div>
		</div>
	{/if}

	<div class="flex justify-center mt-4">
		<button class="btn coral text-xl" onclick={playAgain}>Play Again</button>
	</div>
</div>
