<script lang="ts">
	import PresenterScene from '$lib/components/PresenterScene.svelte';
	import { getTimeRemaining, POINTS_PER_RANK, ROUND_COUNT } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let now = $state(Date.now());

	onMount(() => {
		const interval = setInterval(() => {
			now = Date.now();
		}, 1000);
		return () => clearInterval(interval);
	});

	let display = $derived(getTimeRemaining('reveal', roomState.gameState.phaseStartedAt, now));

	let needsVoting = $derived(roomState.gameState.players.length > 1);

	let voterCount = $derived(roomState.gameState.players.length);
	let votedCount = $derived(roomState.gameState.votes.length);

	let allVoted = $derived(voterCount > 0 && votedCount >= voterCount);

	let playerPoints = $derived.by(() => {
		const points: Record<string, number> = {};
		const voters: Record<string, { voterId: string; rank: number }[]> = {};
		for (const p of roomState.gameState.players) {
			points[p.id] = 0;
			voters[p.id] = [];
		}
		for (const vote of roomState.gameState.votes) {
			for (let i = 0; i < vote.rankings.length; i++) {
				const pid = vote.rankings[i];
				const pts = POINTS_PER_RANK[i] ?? 0;
				points[pid] = (points[pid] ?? 0) + pts;
				voters[pid] = voters[pid] ?? [];
				voters[pid].push({ voterId: vote.voterId, rank: i });
			}
		}
		return { points, voters };
	});

	let sortedPlayers = $derived.by(() => {
		const { points } = playerPoints;
		return [...roomState.gameState.players].sort(
			(a, b) => (points[b.id] ?? 0) - (points[a.id] ?? 0)
		);
	});

	function advance() {
		roomState.send({ type: 'phase', phase: 'scores' });
	}

	function nextRound() {
		roomState.send({ type: 'next-round' });
	}

	function voterName(voterId: string) {
		return roomState.gameState.players.find((p) => p.id === voterId)?.name ?? '???';
	}

	function rankLabel(index: number) {
		const labels = ['①', '②', '③'];
		return labels[index] ?? '';
	}

	function rankColor(index: number) {
		const colors = ['text-yellow-500', 'text-sky-500', 'text-grape-500'];
		return colors[index] ?? '';
	}
</script>

<div class="frame">
	<div
		class="absolute z-10 -top-3 -right-3 bg-white ink py-1.5 px-4 font-title font-bold text-xl rotate-3"
	>
		{roomState.gameState.round} / {ROUND_COUNT}
	</div>

	{#if needsVoting}
		<div class="text-center font-title text-2xl font-bold mt-2 mb-1">Voting in progress</div>
	{:else}
		<div class="text-center font-title text-2xl font-bold mt-2 mb-1">How did you do?</div>
	{/if}

	<div
		class="h-36 flex items-center justify-center border-3 border-dashed border-ink rounded-2xl relative overflow-clip stripes mb-3 max-w-lg mx-auto"
	>
		<PresenterScene />
		<PresenterScene ortho />
	</div>

	{#if needsVoting}
		<div class="flex items-center justify-between mb-2 max-w-lg mx-auto">
			<div class="bg-white ink-sm py-1 px-3 font-title font-bold text-sm">
				{display || '--:--'}
			</div>
			<div class="text-sm font-title font-bold">
				<span class="text-grass">{votedCount}</span>/{voterCount} votes cast
			</div>
		</div>

		<div class="flex gap-2 flex-wrap justify-center">
			{#each sortedPlayers as player, i (player.id)}
				{@const pts = playerPoints.points[player.id] ?? 0}
				{@const voterList = playerPoints.voters[player.id] ?? []}
				<div class="shrink-0 flex flex-col items-center">
					<div class="flex items-center gap-1 mb-1">
						<span class="font-title font-bold text-sm">#{i + 1}</span>
						<span
							class="bg-ink text-white text-xs font-bold rounded-full size-5 flex items-center justify-center"
						>
							{pts}
						</span>
					</div>
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
						<div class="size-40 ink overflow-clip shrink-0">
							<img
								src={player.drawing}
								alt={`${player.name}'s drawing`}
								class="size-full object-cover"
							/>
						</div>
					</div>

					<div class="font-title font-bold text-sm mt-1">{player.name}</div>

					<div class="flex gap-1 mt-1 flex-wrap justify-center max-w-40">
						{#each voterList as v (v)}
							<div
								class="flex items-center gap-0.5 bg-white border-2 border-ink rounded-full px-1.5 py-0.5 text-xs"
							>
								<span class="{rankColor(v.rank)} font-bold">{rankLabel(v.rank)}</span>
								<span>{voterName(v.voterId)}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-4 flex justify-center">
			<button class="btn coral text-lg" onclick={advance}>
				{allVoted ? 'View Scores' : 'Waiting for votes…'}
			</button>
		</div>
	{:else}
		<div class="flex gap-2 flex-wrap justify-center">
			{#each roomState.gameState.players as player, i (player.id)}
				<div class="shrink-0 flex flex-col items-center">
					<div class="relative">
						<div
							class="size-14 absolute -top-2 -left-2 border-3 border-ink flex items-center justify-center text-2xl shrink-0 overflow-clip {[
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
						<div class="size-50 ink overflow-clip shrink-0">
							<img src={player.drawing} alt={`${player.name}'s drawing`} class="size-full" />
						</div>
					</div>
				</div>
			{/each}
		</div>

		<button class="btn coral text-lg absolute z-10 -top-4 -right-4" onclick={nextRound}
			>next round</button
		>
	{/if}
</div>
