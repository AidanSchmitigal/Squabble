<script lang="ts">
	const letters = 'SQUABBLEWORDLE'.split('');
	const colors = ['var(--green)', 'var(--yellow)', 'var(--gray-tile)'];

	const tiles = Array.from({ length: 22 }, () => ({
		letter: letters[Math.floor(Math.random() * letters.length)],
		left: `${Math.random() * 100}vw`,
		background: colors[Math.floor(Math.random() * colors.length)],
		duration: `${14 + Math.random() * 16}s`,
		delay: `${-Math.random() * 20}s`,
		size: `${0.8 + Math.random() * 0.5}`,
		rotate: `${Math.random() * 360}deg`
	}));
</script>

<div class="bgTiles">
	{#each tiles as tile (tile)}
		<div
			class="falling-tile"
			style:left={tile.left}
			style:background={tile.background}
			style:animation-duration={tile.duration}
			style:animation-delay={tile.delay}
			style="--rotate:{tile.rotate};--size:{tile.size}"
		>
			{tile.letter}
		</div>
	{/each}
</div>

<style>
	.bgTiles {
		position: fixed;
		inset: 0;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
		background: var(--bg);
		opacity: 0.16;
	}

	.falling-tile {
		position: absolute;
		top: -60px;
		width: 34px;
		height: 34px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-display);
		font-size: 16px;
		color: rgba(255, 255, 255, 0.85);
		animation: fallDown linear infinite;
	}

	@keyframes fallDown {
		0% {
			transform: translateY(-5vh) rotate(0deg) scale(var(--size));
		}
		100% {
			transform: translateY(110vh) rotate(var(--rotate)) scale(var(--size));
		}
	}
</style>
