<script lang="ts">
	import { roomState } from '$lib/room.svelte';

	let sortedPlayers = $derived.by(() => {
		return [...roomState.gameState.players].sort((a, b) => b.score - a.score);
	});

	function nextRound() {
		roomState.send({ type: 'next-round' });
	}
</script>

<div class="frame relative">
	<div class="text-center font-title text-2xl font-bold mb-4">Leaderboard</div>

	<div class="divide-ink/20 divide-y-2 max-w-lg mx-auto">
		{#each sortedPlayers as player, i (player.id)}
			<div class="flex items-center gap-4 p-3 bg-white">
				<div class="font-title font-bold text-4xl w-10 text-center shrink-0">
					{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
				</div>

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

				<div class="flex-1 min-w-0">
					<div class="font-title font-bold text-xl truncate">{player.name}</div>
				</div>

				<div class="text-right shrink-0">
					<div class="font-title font-bold text-2xl">{player.score}</div>
					<div class="text-xs text-ink/50">points</div>
				</div>
			</div>
		{/each}
	</div>

	<button class="btn coral text-lg absolute -top-4 -right-4" onclick={nextRound}>next round</button>
</div>
