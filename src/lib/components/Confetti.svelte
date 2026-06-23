<script lang="ts">
	import { onMount } from 'svelte';

	const CONFETTI_COLORS = [
		'var(--coral)',
		'var(--yellow)',
		'var(--sky)',
		'var(--grass)',
		'var(--grape)',
		'var(--pink)'
	];

	type ConfettiPiece = {
		left: string;
		color: string;
		width: string;
		height: string;
		delay: string;
		duration: string;
		rotation: string;
	};

	let confetti: ConfettiPiece[] = $state([]);

	onMount(() => {
		const pieces: ConfettiPiece[] = [];
		for (let i = 0; i < 60; i++) {
			pieces.push({
				left: `${Math.random() * 100}%`,
				color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
				width: `${Math.random() * 8 + 4}px`,
				height: `${Math.random() * 8 + 4}px`,
				delay: `${Math.random() * 3}s`,
				duration: `${Math.random() * 3 + 2}s`,
				rotation: `${Math.random() * 360}deg`
			});
		}
		confetti = pieces;
		setInterval(() => {
			confetti.push({
				left: `${Math.random() * 100}%`,
				color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
				width: `${Math.random() * 8 + 4}px`,
				height: `${Math.random() * 8 + 4}px`,
				delay: `${Math.random() * 3}s`,
				duration: `${Math.random() * 3 + 2}s`,
				rotation: `${Math.random() * 360}deg`
			});
		}, 100);
	});
</script>

<div class="confetti-container">
	{#each confetti as piece, i (i)}
		<div
			class="confetti-piece"
			style="left: {piece.left}; background: {piece.color}; width: {piece.width}; height: {piece.height}; animation-delay: {piece.delay}; animation-duration: {piece.duration}; --rot: {piece.rotation};"
		></div>
	{/each}
</div>

<style>
	.confetti-container {
		position: absolute;
		inset: 0;
		pointer-events: none;
		overflow: hidden;
	}

	.confetti-piece {
		position: absolute;
		top: -12px;
		border-radius: 2px;
		animation: confetti-fall var(--duration, 3s) ease-out var(--delay, 0s) 1 forwards;
		opacity: 0;
	}

	@keyframes confetti-fall {
		0% {
			transform: translateY(0) rotate(0deg) scale(1);
			opacity: 1;
		}
		100% {
			transform: translateY(500px) rotate(var(--rot, 360deg)) scale(0.3);
			opacity: 0;
		}
	}
</style>
