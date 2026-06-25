<script lang="ts">
	let { hp }: { hp: number } = $props();

	interface Pop {
		id: number;
		text: string;
		isHeal: boolean;
		left: number;
	}

	let pops: Pop[] = $state([]);
	let popId = 0;
	let prevHp: number | undefined;

	$effect(() => {
		if (prevHp !== undefined && hp !== prevHp) {
			const delta = hp - prevHp;
			if (delta < 0 && delta > -1) {
				prevHp = hp;
				return;
			}
			const id = popId++;
			const text = delta < 0 ? String(delta) : '+' + delta;
			pops = [...pops, { id, text, isHeal: delta > 0, left: 20 + Math.random() * 60 }];
			setTimeout(() => {
				pops = pops.filter((p) => p.id !== id);
			}, 1000);
		}
		prevHp = hp;
	});
</script>

{#each pops as pop (pop.id)}
	<div
		class="dmg-pop"
		class:heal={pop.isHeal}
		class:dmg={!pop.isHeal}
		style="left:{pop.left}%"
	>
		{pop.text}
	</div>
{/each}

<style>
	.dmg-pop {
		position: absolute;
		bottom: 100%;
		font-family: var(--font-mono);
		font-weight: 800;
		font-size: 22px;
		pointer-events: none;
		z-index: 55;
		animation: dmgFloat 1s ease forwards;
		white-space: nowrap;
	}
	.dmg-pop.heal {
		color: var(--green);
	}
	.dmg-pop.dmg {
		color: var(--red);
	}
	@keyframes dmgFloat {
		0% {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateX(-50%) translateY(-50px);
		}
	}
</style>
