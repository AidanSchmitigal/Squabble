<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	const COLORS = ['var(--green)', 'var(--yellow)', '#b752cb', 'var(--gray-tile)', '#fff'];

	interface Piece {
		id: number;
		left: string;
		color: string;
		duration: string;
		delay: string;
	}

	let pieces: Piece[] = $state([]);
	let nextId = 0;
	let interval: ReturnType<typeof setInterval>;

	function spawnBatch() {
		const batch: Piece[] = [];
		for (let i = 0; i < 10; i++) {
			batch.push({
				id: nextId++,
				left: Math.random() * 100 + 'vw',
				color: COLORS[Math.floor(Math.random() * COLORS.length)],
				duration: 2 + Math.random() * 2 + 's',
				delay: Math.random() * 0.3 + 's'
			});
		}
		pieces = [...pieces, ...batch];
		setTimeout(() => {
			const cutoff = nextId - 30;
			pieces = pieces.filter((p) => p.id >= cutoff);
		}, 5000);
	}

	onMount(() => {
		spawnBatch();
		interval = setInterval(spawnBatch, 800);
	});

	onDestroy(() => {
		clearInterval(interval);
	});
</script>

{#each pieces as piece (piece.id)}
	<div
		class="confetti-piece"
		style="left:{piece.left};background:{piece.color};animation-duration:{piece.duration};animation-delay:{piece.delay}"
	></div>
{/each}
