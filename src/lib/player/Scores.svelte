<script lang="ts">
	import { roomState } from '$lib/room.svelte';

	let sortedPlayers = $derived.by(() => {
		return [...roomState.gameState.players].sort((a, b) => b.score - a.score);
	});

	let myId = $derived(roomState.selfId);

	function scoreChange(playerId: string): number {
		const vote = roomState.gameState.votes.find((v) => v.voterId === playerId);
		if (!vote) return 0;
		return 0;
	}
</script>

<div class="frame max-w-lg">
	<div class="w-18 h-2 bg-ink rounded mx-auto mb-2"></div>
	<div class="text-center font-title text-2xl font-bold mb-4">Leaderboard</div>

	<div class="space-y-2 max-w-lg mx-auto">
		{#each sortedPlayers as player, i (player.id)}
			{@const isMe = player.id === myId}
			<div
				class="flex items-center gap-3 p-2 rounded-2xl border-3 {isMe
					? 'border-yellow bg-yellow/10'
					: 'border-none bg-white'}"
			>
				<div class="font-title font-bold text-3xl w-8 text-center shrink-0">
					{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
				</div>

				<div
					class="size-10 ink-sm relative flex items-center justify-center text-2xl shrink-0 overflow-clip {[
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
					<div class="font-title font-bold text-base truncate">{player.name}</div>
				</div>

				<div class="text-right shrink-0">
					<div class="font-title font-bold text-lg">{player.score}</div>
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-4 text-center font-title text-lg">
		Waiting for the host to start the next round…
	</div>
</div>
