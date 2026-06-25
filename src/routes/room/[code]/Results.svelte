<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { hpClass, toastMsg } from '$lib';
	import { type GameState } from '$lib/game';
	import { roomState } from '$lib/room.svelte';

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

	let matchHistory = $state<{ place: number; total: number; words: number; date: string }[]>([]);
	$effect(() => {
		try {
			matchHistory = JSON.parse(localStorage.getItem('squabble_history') || '[]');
		} catch {
			matchHistory = [];
		}
	});

	function playAgain() {
		roomState.disconnect();
		goto(resolve('/'));
	}

	function backToMain() {
		roomState.disconnect();
		goto(resolve('/'));
	}

	function shareResult() {
		const txt = `I placed #${placement} in Squabble!`;
		navigator.clipboard?.writeText(txt).catch(() => {});
		toastMsg('Result copied to clipboard');
	}
</script>

<section class="screen active" id="screen-results">
	<div class="results-wrap">
		<div class="results-banner">
			{#if winner}
				{@const isMe = winner.id === selfId}
				<div class="winner-avatar">
					<img src={winner.avatar} alt="{winner.name} avatar" />
				</div>
				<div class="winner-label">👑 {isMe ? 'You won!' : winner.name + ' won!'}</div>
			{:else}
				<div class="winner-label">Game Over</div>
			{/if}
		</div>

		<div class="stat-grid">
			<div class="stat-box">
				<div class="val">{me?.wordsSolved ?? 0}</div>
				<div class="lbl">Words solved</div>
			</div>
			<div class="stat-box">
				<div class="val">{me?.damageDealt ?? 0}</div>
				<div class="lbl">Damage dealt</div>
			</div>
			<div class="stat-box">
				<div class="val">{me?.damageTaken ?? 0}</div>
				<div class="lbl">Damage taken</div>
			</div>
			<div class="stat-box">
				<div class="val">{timeSurvived}s</div>
				<div class="lbl">Time survived</div>
			</div>
		</div>

		<div class="results-grid">
			<div class="card">
				<span class="section-label">Final Standings</span>
				<div class="standings-list">
					{#each sorted as p, i (i)}
						{@const rank = i + 1}
						<div
							class="standing-row"
							class:me={p.id === selfId}
							class:winner={p.id === gameState.winnerId}
						>
							<span class="rank-badge"
								>{rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '#' + rank}</span
							>
							<div class="avatar-frame"><img src={p.avatar} alt="{p.name} avatar" /></div>
							<span class="pname">{p.name} {p.id === selfId ? '(you)' : ''}</span>
							<div class="hp-wrap-sm">
								<div class="hp-bar-track-sm">
									<div
										class="hp-bar-fill-sm {hpClass(p.hp)}"
										style="width:{Math.max(0, p.hp)}%"
									></div>
								</div>
								<span class="hp-num-sm">{Math.max(0, Math.round(p.hp))}</span>
							</div>
							<span class="word-count">📜 {p.wordIndex + 1}</span>
						</div>
					{/each}
				</div>
			</div>

			<div class="card" style="width:100%">
				<span class="section-label">Match history (saved locally)</span>
				<div class="history-list">
					{#if matchHistory.length === 0}
						<div style="color:var(--ink-faint);font-size:12px;text-align:center;padding:10px">
							No matches yet &mdash; play your first Squabble!
						</div>
					{:else}
						{#each matchHistory as h, i (i)}
							<div class="history-row">
								<span>#{h.place} <span style="color:var(--ink-faint)">/ {h.total}</span></span>
								<span><b>{h.words}</b> words</span>
								<span>{new Date(h.date).toLocaleDateString()}</span>
							</div>
						{/each}
					{/if}
				</div>
			</div>
		</div>

		<div class="results-actions">
			<button class="btn btn-primary" onclick={playAgain}>↻ Play Again</button>
			<button class="btn btn-purple" onclick={shareResult}>📋 Copy result</button>
			<button class="btn btn-ghost" onclick={backToMain}>Back to main menu</button>
		</div>
	</div>
</section>
