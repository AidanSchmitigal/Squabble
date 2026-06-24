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
	Squabble &middot; competitive Wordle &middot;
	<a href="https://squabble.me/" target="_blank">original game by Ottomated</a>
</div>
