<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Confetti from '$lib/components/Confetti.svelte';
	import { roomState } from '$lib/room.svelte';
	import { onMount } from 'svelte';

	let sortedPlayers = $derived.by(() => {
		return [...roomState.gameState.players].sort((a, b) => b.score - a.score);
	});

	let top3 = $derived(sortedPlayers.slice(0, 3));
	let rest = $derived(sortedPlayers.slice(3));

	function playAgain() {
		goto(resolve('/'));
	}
</script>

<div class="frame relative overflow-hidden">
	<Confetti />

	<div class="text-center font-title text-3xl font-bold mb-2 relative z-10">Game Over!</div>

	<div class="flex items-end justify-center gap-4 mb-6 relative z-10">
		{#each top3 as player, i (player.id)}
			{@const rank = sortedPlayers.indexOf(player)}
			<div
				class="flex flex-col items-center {rank === 0
					? 'order-2'
					: rank === 1
						? 'order-1'
						: 'order-3'}"
			>
				<div class="font-title text-5xl mb-1">
					{rank === 0 ? '👑' : rank === 1 ? '🥈' : '🥉'}
				</div>
				<div
					class="{rank === 0 ? 'size-20 ink' : 'size-16 ink-sm'} overflow-clip {[
						'blob1',
						'blob2',
						'blob3'
					][i % 3]}"
				>
					{#if player.avatar.drawing}
						<img src={player.avatar.drawing} alt={`${player.name}'s avatar`} class="size-full" />
					{:else}
						<div class="size-full bg-white"></div>
					{/if}
				</div>
				<div class="font-title font-bold text-sm mt-1 text-center max-w-28 truncate">
					{player.name}
				</div>
				<div class="font-title font-bold text-lg">{player.score}</div>
				<div
					class="w-24 {rank === 0
						? 'h-26 bg-yellow'
						: rank === 1
							? 'h-22 bg-sky'
							: 'h-18 bg-grape'} border-b-3 border-ink rounded-t-xl mt-1"
				>
					<div class="text-center font-title font-bold text-xs text-white pt-0.5">
						{rank === 0 ? '1ST' : rank === 1 ? '2ND' : '3RD'}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if rest.length > 0}
		<div class="space-y-1.5 relative z-10">
			{#each rest as player, i (player.id)}
				<div class="flex items-center gap-3 p-2 rounded-2xl border-3 border-ink/20 bg-white">
					<div class="font-title font-bold text-lg w-8 text-center shrink-0">#{i + 4}</div>
					<div
						class="size-10 shrink-0 border-2 border-ink overflow-clip {['blob1', 'blob2', 'blob3'][
							(i + 3) % 3
						]}"
					>
						{#if player.avatar.drawing}
							<img src={player.avatar.drawing} alt={`${player.name}'s avatar`} class="size-full" />
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
	{/if}

	<div class="mt-6 flex justify-center relative z-10">
		<button class="btn coral text-xl" onclick={playAgain}>Play Again</button>
	</div>
</div>
