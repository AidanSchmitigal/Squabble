<script lang="ts">
	import BackgroundTiles from '$lib/components/BackgroundTiles.svelte';
	import { getToasts } from '$lib/toast.svelte';
	import './layout.css';

	let { children } = $props();

	let toasts = $derived(getToasts());
</script>

<BackgroundTiles />
<div id="toastWrap">
	{#each toasts as toast (toast.id)}
		<div class="toast">{toast.msg}</div>
	{/each}
</div>
<div id="app">
	{@render children()}
</div>
<div class="top-credit">
	Squabble &middot; competitive Wordle &middot;
	<a href="https://squabble.me/" target="_blank">original game by Ottomated</a>
</div>
