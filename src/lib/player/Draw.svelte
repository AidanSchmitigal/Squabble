<script lang="ts">
	import DrawingCanvas from '$lib/components/DrawingCanvas.svelte';
	import { roomState } from '$lib/room.svelte';

	let drawingDataUrl = $state('');

	let selfPlayer = $derived(roomState.gameState.players.find((p) => p.id === roomState.selfId));
	let done = $derived(selfPlayer?.done ?? false);

	function submitDrawing() {
		if (drawingDataUrl) {
			roomState.send({ type: 'drawing', dataUrl: drawingDataUrl });
		}
		roomState.send({ type: 'done', done: true });
	}
</script>

<div class="frame max-w-lg">
	<div class="w-18 h-2 bg-ink rounded mx-auto mb-2"></div>
	<div class="text-center">
		<div class="flex gap-1.5 justify-center mb-2 overflow-x-auto">
			{#each roomState.gameState.players as player, i (player.id)}
				<div class="shrink-0 flex flex-col items-center">
					<div
						class="size-10 ink-sm relative flex items-center justify-center text-2xl shrink-0 overflow-clip {[
							'blob1',
							'blob2',
							'blob3'
						][i % 3]}"
					>
						{#if player.avatar.drawing}
							<img src={player.avatar.drawing} alt={`${player.name}'s drawing`} />
						{:else}
							<div class="size-full bg-white"></div>
						{/if}
					</div>
					<div class="bg-grass border-2 border-ink rounded-xl text-xs font-bold py-px px-1.5 mt-1">
						{player.done ? '✓ done' : 'drawing…'}
					</div>
				</div>
			{/each}
		</div>

		<DrawingCanvas
			oninstant={(url) => {
				drawingDataUrl = url;
				roomState.send({ type: 'drawing', dataUrl: url });
			}}
			onupdate={(url) => {
				drawingDataUrl = url;
				roomState.send({ type: 'drawing', dataUrl: url });
			}}
		/>

		<button class="btn coral w-full text-lg" onclick={submitDrawing} disabled={done}>
			{done ? 'submitted! ✓' : 'submit drawing 🎨'}
		</button>
	</div>
</div>
