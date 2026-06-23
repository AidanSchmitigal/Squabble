<script lang="ts">
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<div class="frame relative">
	<span class="confetti" style="top: 6px; left: 10%; animation-delay: 0.2s">✦</span>
	<span class="confetti" style="top: 30px; left: 80%; animation-delay: 1s">🎈</span>
	<span class="confetti" style="top: 6px; left: 55%; animation-delay: 1.6s">✦</span>
	<span class="confetti" style="top: 60px; left: 30%; animation-delay: 0.8s">🎈</span>

	<div class="text-center">
		<a href={resolve('/')}>
			<h1 class="squiggle-underline text-4xl mb-1.5">
				Doodle Party
				<svg viewBox="0 0 200 10" preserveAspectRatio="none"
					><path
						d="M0,6 Q10,0 20,6 T40,6 T60,6 T80,6 T100,6 T120,6 T140,6 T160,6 T180,6 T200,6"
						stroke="#ff6b5b"
						stroke-width="4"
						fill="none"
						stroke-linecap="round"
					></path></svg
				>
			</h1>
		</a>
	</div>

	{@render children()}
</div>

<style>
	.confetti {
		position: absolute;
		font-size: 20px;
		opacity: 0.8;
		animation: float 3.5s ease-in-out infinite;
	}
	@keyframes float {
		0%,
		100% {
			transform: translateY(0) rotate(0deg);
		}
		50% {
			transform: translateY(-10px) rotate(12deg);
		}
	}
</style>
