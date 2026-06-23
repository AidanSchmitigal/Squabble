<script lang="ts">
	import './layout.css';

	let { children } = $props();
</script>

<div id="bgTiles"></div>
<div id="toastWrap"></div>
<div id="app">
	{@render children()}
</div>
<div class="top-credit">
	Squabble &mdash; competitive Wordle &middot; original game by
	<a href="https://twitter.com/Ottomated_" target="_blank">Ottomated</a>
</div>
