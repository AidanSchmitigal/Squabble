<script lang="ts">
	import { onMount } from 'svelte';

	const word = 'SQUABBLE';
	const accentCycle = ['var(--gray-tile)', 'var(--yellow)', 'var(--green)'];
</script>

<div class="flex gap-2" id="heroLogo">
	{#each word.split('') as ch, i}
		{@const accent = accentCycle[i % accentCycle.length]}
		<div class="tile-wrap" style="--i:{i};">
			<div
				class="logo-tile"
				style="--accent-bg:{accent};--accent-color:{accent};color:{i % accentCycle.length === 0
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
	}
	.tile-wrap {
		transform: rotateX(90deg);
		animation: tileFlipIn 0.5s ease forwards;
		animation-delay: calc(var(--i) * 90ms);
	}

	.tile-wrap:hover .logo-tile {
		transform: rotateX(360deg);
		transition: transform 0.5s ease;
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
