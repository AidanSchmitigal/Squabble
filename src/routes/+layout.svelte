<script lang="ts">
	import BackgroundTiles from '$lib/components/BackgroundTiles.svelte';
	import './layout.css';

	let { children } = $props();
</script>

<BackgroundTiles />
<div id="toastWrap"></div>
<div id="app">
	{@render children()}
</div>
<div class="top-credit">
	Squabble &middot; competitive Wordle &middot;
	<a href="https://squabble.me/" target="_blank">original game by Ottomated</a>
</div>
