<script lang="ts">
	let show = $state(false);
</script>

<button class="btn btn-ghost btn-block" onclick={() => (show = true)}>📖 How to play</button>

{#if show}
	<div class="modal-overlay">
		<div class="modal">
			<div class="modal-head">
				<h2>How to play</h2>
				<button class="icon-btn" onclick={() => (show = false)}>✕</button>
			</div>
			<div class="howto-tile-row">
				<div
					class="howto-tile"
					style="background:var(--green);border-color:var(--green);color:#0e1a0d"
				>
					C
				</div>
				<div
					class="howto-tile"
					style="background:var(--yellow);border-color:var(--yellow);color:#1a1606"
				>
					R
				</div>
				<div
					class="howto-tile"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					A
				</div>
				<div
					class="howto-tile"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					N
				</div>
				<div
					class="howto-tile"
					style="background:var(--gray-tile);border-color:var(--gray-tile);color:#fff"
				>
					E
				</div>
			</div>
			<div class="howto-step">
				<b>🟩 Green</b> &mdash; letter is correct &amp; in the right spot.
			</div>
			<div class="howto-step"><b>🟨 Yellow</b> &mdash; letter is in the word, wrong spot.</div>
			<div class="howto-step"><b>⬛ Gray</b> &mdash; letter isn't in the word at all.</div>
			<div class="howto-step">
				⏱️ You take <b>1 damage every second</b>, always. The clock never stops.
			</div>
			<div class="howto-step">
				✅ Solve the word to <b>heal</b> and <b>deal damage</b> to a random rival, sending them garbage.
			</div>
			<div class="howto-step">
				❌ A wrong guess costs you extra HP &mdash; guess carefully, but don't stall.
			</div>
			<div class="howto-step">
				🏆 Everyone shares the same word list. Last fighter standing wins the Squabble.
			</div>
			<button class="btn btn-primary btn-block" onclick={() => (show = false)}>Got it</button>
		</div>
	</div>
{/if}
