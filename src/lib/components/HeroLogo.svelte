<script lang="ts">
	import { play } from '$lib/feedback.svelte';

	const word = 'SQUABBLE';
	const accentCycle = ['var(--gray-tile)', 'var(--yellow)', 'var(--green)'];

	let spins = $state(Array(word.length).fill(0));

	function bump(i: number) {
		spins[i] += 1;
		play('key');
		navigator.vibrate?.(4);
	}
</script>

<div class="flex gap-2" id="heroLogo">
	{#each word.split('') as ch, i (i)}
		{@const accent = accentCycle[i % accentCycle.length]}
		<div class="tile-wrap" style="--i:{i};" onpointerenter={() => bump(i)} role="banner">
			<div
				class="logo-tile"
				style="--accent-bg:{accent};--accent-color:{accent};--spins:{spins[i]};color:{i %
					accentCycle.length ===
				0
					? '#fff'
					: '#1a1606'}"
			>
				{ch}
			</div>
		</div>
	{/each}
</div>

<style>
	.logo-tile {
		width: 54px;
		height: 54px;
		border-radius: 8px;
		border: 2px solid var(--border);
		background: var(--surface);
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 26px;
		color: var(--ink);
		position: relative;
		border-color: var(--accent-color, var(--border));
		background: var(--accent-bg, var(--surface));
		user-select: none;
		cursor: pointer;

		transform: rotateX(calc(var(--spins, 0) * 360deg));
		transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.tile-wrap {
		transform: rotateX(90deg);
		animation: tileFlipIn 0.6s ease forwards;
		animation-delay: calc(var(--i) * 90ms);
	}

	@keyframes tileFlipIn {
		0% {
			transform: rotateX(90deg);
		}
		60% {
			transform: rotateX(-12deg);
		}
		100% {
			transform: rotateX(0deg);
		}
	}
</style>
