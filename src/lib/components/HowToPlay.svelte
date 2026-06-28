<script lang="ts">
	import { clickFeedback } from '$lib/feedback.svelte';
	let show = $state(false);
</script>

<button class="btn btn-ghost btn-block" onclick={() => (show = true)} use:clickFeedback>📖 How to play</button>

{#if show}
	<div
		class="fixed inset-0 bg-bg/70 backdrop-blur-sm z-50 flex items-center justify-center p-5 animate-fadeup"
	>
		<div
			class="bg-surface border border-border rounded p-6 max-w-md w-full shadow-pop overflow-y-auto max-h-[85vh]"
		>
			<div class="flex justify-between items-start mb-4">
				<h2 class="font-display text-lg m-0">How to play</h2>
				<button class="icon-btn" onclick={() => (show = false)} use:clickFeedback>✕</button>
			</div>
			<div class="flex gap-2 my-3">
				<div
					class="size-9 rounded-xs flex items-center justify-center font-display text-lg border-2 border-border"
					style="background:var(--green);border-color:var(--green);color:#0e1a0d"
				>
					C
				</div>
				<div
					class="size-9 rounded-xs flex items-center justify-center font-display text-lg border-2 border-border"
					style="background:var(--yellow);border-color:var(--yellow);color:#1a1606"
				>
					R
				</div>
				<div
					class="size-9 rounded-xs flex items-center justify-center font-display text-lg border-2 border-border"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					A
				</div>
				<div
					class="size-9 rounded-xs flex items-center justify-center font-display text-lg border-2 border-border"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					N
				</div>
				<div
					class="size-9 rounded-xs flex items-center justify-center font-display text-lg border-2 border-border"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					E
				</div>
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				<b class="text-ink">🟩 Green</b> &mdash; letter is correct &amp; in the right spot.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				<b class="text-ink">🟨 Yellow</b> &mdash; letter is in the word, wrong spot.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				<b class="text-ink">⬛ Gray</b> &mdash; letter isn't in the word at all.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				⏱️ You take <b class="text-ink">1 damage every second</b>, always. The clock never stops.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				✅ Solve the word to <b class="text-ink">heal</b> and <b class="text-ink">deal damage</b> to a
				random rival, sending them garbage.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				🟩🟨 Green &amp; yellow letters <b class="text-ink">heal you</b> (+3 HP per 🟩, +1 per 🟨) &mdash;
				every guess helps.
			</div>
			<div class="mb-3 text-sm text-ink-dim">
				🏆 Everyone shares the same word list. Last fighter standing wins the Squabble.
			</div>
			<button class="btn btn-primary btn-block" onclick={() => (show = false)} use:clickFeedback>Got it</button>
		</div>
	</div>
{/if}
