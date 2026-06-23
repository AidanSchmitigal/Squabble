<script lang="ts">
	import PresenterScene from '$lib/components/PresenterScene.svelte';
	import { getTimeRemaining } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let myId = $derived(roomState.selfId);

	let myPlayer = $derived(roomState.gameState.players.find((p) => p.id === roomState.selfId)!);
	let otherPlayers = $derived(roomState.gameState.players.filter((p) => p.id !== myId));
	let maxRank = $derived(Math.min(3, otherPlayers.length));
	let needsVoting = $derived(roomState.gameState.players.length > 1);

	let ranking: (string | null)[] = $state([null, null, null]);

	let myVote = $derived(roomState.gameState.votes.find((v) => v.voterId === myId));
	let voted = $derived(!!myVote);

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let display = $derived(getTimeRemaining('reveal', roomState.gameState.phaseStartedAt, now));

	let canSubmit = $derived(
		!voted && ranking.slice(0, maxRank).every((r) => r !== null) && maxRank > 0
	);

	function selectRank(playerId: string, rankIndex: number) {
		if (voted) return;
		if (playerId === myId) return;

		const prev = ranking[rankIndex];
		if (prev === playerId) {
			ranking[rankIndex] = null;
			return;
		}

		const existingIdx = ranking.indexOf(playerId);
		if (existingIdx !== -1) {
			ranking[existingIdx] = null;
		}

		if (prev !== null) {
			const prevIdx = ranking.indexOf(prev);
			if (prevIdx !== -1) ranking[prevIdx] = null;
		}

		ranking[rankIndex] = playerId;
		ranking = [...ranking];
	}

	function submitVotes() {
		const valid = ranking.slice(0, maxRank).filter((r): r is string => r !== null);
		if (valid.length === 0) return;
		roomState.send({ type: 'submit-vote', rankings: valid });
	}

	function rankLabel(index: number) {
		const labels = ['🥇', '🥈', '🥉'];
		return labels[index] ?? '';
	}

	function rankColor(index: number) {
		const colors = ['text-yellow-500', 'text-sky-500', 'text-grape-500'];
		return colors[index] ?? '';
	}
</script>

<div class="frame max-w-lg">
	<div class="text-center font-title text-2xl font-bold mt-2 mb-1">
		{needsVoting ? 'Vote for the best drawing!' : 'How did you do?'}
	</div>

	<div
		class="h-36 flex items-center justify-center border-3 border-dashed border-ink rounded-2xl relative overflow-clip stripes mb-3"
	>
		<PresenterScene />
		<PresenterScene ortho />
	</div>

	{#if needsVoting}
		<div class="flex items-center justify-between mb-2">
			<div class="bg-white ink-sm py-1 px-3 font-title font-bold text-sm">
				{display}
			</div>
			<div class="text-sm font-title text-ink/70">
				{roomState.gameState.votes.length}/{roomState.gameState.players.length} voted
			</div>
		</div>

		{#if maxRank === 0}
			<div class="text-center font-title text-lg text-ink/60 py-8">
				Waiting for the host to continue…
			</div>
		{:else}
			<div class="flex gap-2 flex-wrap gap-y-8 justify-center">
				{#each roomState.gameState.players as player, i (player.id)}
					{@const isSelf = player.id === myId}
					{@const selectedRank = ranking.indexOf(player.id)}
					<div class="shrink-0 flex flex-col items-center {isSelf ? 'opacity-40' : ''}">
						<div class="relative">
							<div
								class="size-12 absolute -top-1.5 -left-1.5 border-3 border-ink flex items-center justify-center text-xl shrink-0 overflow-clip {[
									'blob1',
									'blob2',
									'blob3'
								][i % 3]}"
							>
								{#if player.avatar.drawing}
									<img src={player.avatar.drawing} alt={`${player.name}'s avatar`} />
								{:else}
									<div class="size-full bg-white"></div>
								{/if}
							</div>
							<div class="size-38 ink overflow-clip shrink-0">
								<img
									src={player.drawing}
									alt={`${player.name}'s drawing`}
									class="size-full object-cover"
								/>
							</div>

							{#if !isSelf}
								<div class="absolute w-full justify-center flex gap-1 -bottom-6">
									{#each Array(maxRank) as _, rankIdx (rankIdx)}
										<button
											class="text-4xl size-12 rounded-full border-3 border-ink font-bold flex items-center justify-center cursor-pointer {selectedRank ===
											rankIdx
												? rankColor(rankIdx) + ' bg-yellow ring-3 ring-offset-3 ring-ink'
												: 'bg-white'}"
											onclick={() => selectRank(player.id, rankIdx)}
											disabled={voted}
										>
											{rankLabel(rankIdx)}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="mt-8 flex justify-center">
				{#if !voted}
					<button class="btn coral text-lg" onclick={submitVotes} disabled={!canSubmit}>
						Submit Votes
					</button>
				{/if}
			</div>
		{/if}
	{:else}
		<div class="flex gap-2.5 mt-4 justify-center pt-1.5 px-1">
			<div class="relative">
				<div
					class="size-14 absolute -top-2 -left-2 border-3 border-ink flex items-center justify-center text-2xl shrink-0 overflow-clip blob1"
				>
					{#if myPlayer.avatar.drawing}
						<img src={myPlayer.avatar.drawing} alt={`${myPlayer.name}'s drawing`} />
					{:else}
						<div class="size-full bg-white"></div>
					{/if}
				</div>
				<div class="size-50 ink overflow-clip shrink-0">
					<img src={myPlayer.drawing} alt={`${myPlayer.name}'s drawing`} class="size-full" />
				</div>
			</div>
		</div>
	{/if}
</div>
