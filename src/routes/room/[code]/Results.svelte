<script lang="ts">
	import { toastMsg } from '$lib';
	import Confetti from '$lib/components/Confetti.svelte';
	import { type GameState } from '$lib/game';
	import { roomState } from '$lib/room.svelte';
	import { clickFeedback, play } from '$lib/feedback.svelte';
	import { onMount } from 'svelte';

	let { gameState, selfId }: { gameState: GameState; selfId: string } = $props();

	let me = $derived(gameState.players.find((p) => p.id === selfId));

	let winner = $derived(gameState.players.find((p) => p.id === gameState.winnerId));

	let placement = $derived(me?.placement ?? gameState.players.length);

	let timeSurvived = $derived.by(() => {
		if (!gameState.gameStartedAt) return 0;
		if (me?.eliminatedAt) {
			return Math.floor((me.eliminatedAt - gameState.gameStartedAt) / 1000);
		}
		if (gameState.gameEndedAt) {
			return Math.floor((gameState.gameEndedAt - gameState.gameStartedAt) / 1000);
		}
		return 0;
	});

	let sorted = $derived(
		[...gameState.players].sort((a, b) =>
			a.eliminated === b.eliminated
				? a.id === gameState.winnerId
					? -1
					: b.id === gameState.winnerId
						? 1
						: 0
				: a.eliminated
					? 1
					: -1
		)
	);

	onMount(() => {
		const isWinner = me?.id === gameState.winnerId;
		if (isWinner) {
			play('victory');
			navigator.vibrate?.(50);
		} else {
			play('eliminate');
			navigator.vibrate?.(30);
		}
	});

	function playAgain() {
		roomState.send({ type: 'play-again' });
	}
	function shareResult() {
		const txt = `I placed #${placement} in Squabble!`;
		navigator.clipboard?.writeText(txt).catch(() => {});
		toastMsg('Result copied to clipboard');
	}
</script>

<Confetti />
<section class="screen">
	<div class="w-full max-w-xl flex flex-col gap-5 items-center">
		<div class="flex gap-4 items-center">
			{#if winner}
				{@const isMe = winner.id === selfId}
				<div class="size-10 relative">
					<img src={winner.avatar} alt="{winner.name} avatar" class="size-full" />
					<div
						class="absolute -top-4 -right-2 text-xl rotate-15 drop-shadow-sm drop-shadow-neutral-600"
					>
						👑
					</div>
				</div>
				<div class="font-bold font-display text-6xl">
					{isMe ? 'You won!' : winner.name + ' won!'}
				</div>
			{:else}
				<div class="font-bold font-display text-6xl">Game Over</div>
			{/if}
		</div>

		<hr />

		<div class="grid grid-cols-2 gap-3 items-center w-full">
			<div class="bg-surface-2 border border-border rounded-sm p-3 text-center">
				<div class="font-mono text-2xl font-bold text-yellow">{me?.wordsSolved ?? 0}</div>
				<div class="text-xs text-ink-dim uppercase tracking-wider mt-0.5">Words solved</div>
			</div>
			<div class="bg-surface-2 border border-border rounded-sm p-3 text-center">
				<div class="font-mono text-2xl font-bold text-yellow">{me?.damageDealt ?? 0}</div>
				<div class="text-xs text-ink-dim uppercase tracking-wider mt-0.5">Damage dealt</div>
			</div>
			<div class="bg-surface-2 border border-border rounded-sm p-3 text-center">
				<div class="font-mono text-2xl font-bold text-yellow">{me?.damageTaken ?? 0}</div>
				<div class="text-xs text-ink-dim uppercase tracking-wider mt-0.5">Damage taken</div>
			</div>
			<div class="bg-surface-2 border border-border rounded-sm p-3 text-center">
				<div class="font-mono text-2xl font-bold text-yellow">{timeSurvived}s</div>
				<div class="text-xs text-ink-dim uppercase tracking-wider mt-0.5">Time survived</div>
			</div>
		</div>

		<hr />

		<div class="w-full">
			<span class="font-mono pl-1 text-xs tracking-widerest uppercase text-ink-faint block mb-2"
				>Words</span
			>
			<div class="flex flex-wrap gap-2">
				{#each gameState.words as word, i (word)}
					<div
						class="font-mono text-sm font-bold bg-surface border border-border rounded-sm px-3 py-1.5"
					>
						<span class="text-ink-faint">{i + 1}.</span>
						{word.toUpperCase()}
					</div>
				{/each}
			</div>
		</div>

		<hr />

		<div class="flex flex-col gap-3 items-center w-full">
			<div class="w-full">
				<span class="font-mono pl-1 text-xs tracking-widerest uppercase text-ink-faint block mb-2"
					>Final Standings</span
				>
				<div class="flex flex-col gap-3 w-full">
					{#each sorted as p, i (i)}
						{@const rank = i + 1}
						<div
							class="flex gap-4 items-center bg-surface border border-border rounded-sm p-3 text-center"
							class:me={p.id === selfId}
							class:winner={p.id === gameState.winnerId}
						>
							<span class="text-3xl"
								>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}</span
							>
							<div class="size-8">
								<img src={p.avatar} alt="{p.name} avatar" class="size-full" />
							</div>
							<span class="text-ink">{p.name} {p.id === selfId ? '(you)' : ''}</span>
							<span class="ml-auto font-bold">📜 {p.wordIndex + 1}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<hr />

		<div class="flex gap-2">
			<button class="btn btn-primary" onclick={playAgain} use:clickFeedback>↻ Play Again</button>
			<button class="btn btn-yellow" onclick={shareResult} use:clickFeedback>📋 Copy result</button>
		</div>
	</div>
</section>
