<script lang="ts">
	import { AVATAR_PALETTE, EMPTY_AVATAR, randomAvatar } from '$lib/game';
	import { throttle } from '$lib/index';
	import type { Snippet } from 'svelte';

	let {
		children,
		initialDrawing = '',
		onupdate = () => {},
		oninstant = () => {}
	}: {
		children?: Snippet;
		initialDrawing?: string;
		onupdate?: (url: string) => void;
		oninstant?: (url: string) => void;
	} = $props();

	const palette = ['#ffffff', ...AVATAR_PALETTE];
	const CANVAS_WIDTH = 10;

	const throttledStrokeTick = throttle(() => {
		navigator.vibrate?.(6);
	}, 120);

	let avatarCanvas = $state<HTMLCanvasElement>();
	let brushColor = $state(palette[0]);
	let drawing = false;
	let lastPoint: { x: number; y: number } | null = null;
	let sendTimer: ReturnType<typeof setTimeout> | null = null;
	let undoStack: string[] = $state([]);

	function prepareCanvas(node: HTMLCanvasElement) {
		avatarCanvas = node;
		requestAnimationFrame(() => resetCanvas(node));
		return {
			destroy() {
				if (avatarCanvas === node) avatarCanvas = undefined;
			}
		};
	}

	function resetCanvas(node: HTMLCanvasElement) {
		node.width = CANVAS_WIDTH;
		node.height = CANVAS_WIDTH;

		const context = node.getContext('2d');
		if (!context) return;

		context.imageSmoothingEnabled = false;

		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);

		if (initialDrawing) {
			const image = new Image();
			image.onload = () => context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
			image.src = initialDrawing;
		} else if (initialDrawing === '') {
			randomizeCanvas();
		}
	}

	function pointFromEvent(event: PointerEvent) {
		if (!avatarCanvas) return { x: 0, y: 0 };

		const rect = avatarCanvas.getBoundingClientRect();

		return {
			x: Math.floor(((event.clientX - rect.left) * CANVAS_WIDTH) / rect.width),
			y: Math.floor(((event.clientY - rect.top) * CANVAS_WIDTH) / rect.height)
		};
	}

	function drawPixel(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
		context.fillStyle = color;
		context.fillRect(x, y, 1, 1);
	}

	function drawPixelPerfectLine(
		context: CanvasRenderingContext2D,
		x0: number,
		y0: number,
		x1: number,
		y1: number,
		color: string
	) {
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);

		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;

		let err = dx - dy;

		while (true) {
			drawPixel(context, x0, y0, color);

			if (x0 === x1 && y0 === y1) break;

			const e2 = err * 2;

			if (e2 > -dy) {
				err -= dy;
				x0 += sx;
			} else {
				err += dx;
				y0 += sy;
			}
		}
	}

	function startStroke(event: PointerEvent) {
		if (!avatarCanvas) return;
		undoStack.push(avatarCanvas.toDataURL('image/png'));
		avatarCanvas.setPointerCapture(event.pointerId);
		drawing = true;
		lastPoint = pointFromEvent(event);
		drawStroke(event);
	}

	function drawStroke(event: PointerEvent) {
		if (!avatarCanvas || !drawing || !lastPoint) return;

		const point = pointFromEvent(event);

		const context = avatarCanvas.getContext('2d');
		if (!context) return;

		drawPixelPerfectLine(context, lastPoint.x, lastPoint.y, point.x, point.y, brushColor);

		lastPoint = point;

		throttledStrokeTick();
		queueCanvasSend();
	}

	function endStroke(event: PointerEvent) {
		if (!avatarCanvas || !drawing) return;

		drawing = false;
		lastPoint = null;
		avatarCanvas.releasePointerCapture(event.pointerId);
		onupdate(avatarCanvas.toDataURL('image/png'));
	}

	function queueCanvasSend() {
		if (sendTimer) return;
		sendTimer = setTimeout(() => {
			if (!avatarCanvas) return;
			oninstant(avatarCanvas.toDataURL('image/png'));
			sendTimer = null;
		}, 250);
	}

	function clearCanvas() {
		const context = avatarCanvas?.getContext('2d');
		if (!context || !avatarCanvas) return;
		undoStack.push(avatarCanvas.toDataURL('image/png'));
		const rect = avatarCanvas.getBoundingClientRect();
		context.fillStyle = '#ffffff';
		context.fillRect(0, 0, rect.width, rect.height);
		onupdate(EMPTY_AVATAR);
	}

	function handleKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
			event.preventDefault();
			undo();
		}
	}

	$effect(() => {
		if (typeof window === 'undefined') return;
		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
	});

	function undo() {
		if (undoStack.length === 0) return;
		const url = undoStack.pop();
		if (!url) return;
		const context = avatarCanvas?.getContext('2d');
		if (!context || !avatarCanvas) return;
		context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
		const img = new Image();
		img.onload = () => {
			context.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
			onupdate(url);
		};
		img.src = url;
	}

	function randomizeCanvas() {
		const context = avatarCanvas?.getContext('2d');
		if (!context || !avatarCanvas) return;
		undoStack.push(avatarCanvas.toDataURL('image/png'));

		const ava = randomAvatar();

		for (let x = 0; x < CANVAS_WIDTH; x++) {
			for (let y = 0; y < CANVAS_WIDTH; y++) {
				drawPixel(context, x, y, ava[x + y * CANVAS_WIDTH]);
			}
		}
		onupdate(avatarCanvas.toDataURL('image/png'));
	}
</script>

<div class="flex gap-4">
	<div class="flex relative items-center justify-center shrink-0 size-64 aspect-square">
		<div class="grid-lines size-full absolute inset-0 z-1 pointer-events-none select-none"></div>
		<canvas
			class="size-full block touch-none cursor-crosshair"
			use:prepareCanvas
			onpointerdown={startStroke}
			onpointermove={drawStroke}
			onpointerup={endStroke}
			onpointercancel={endStroke}
		></canvas>
	</div>
	<div class="flex flex-col gap-4 justify-between">
		<div class="flex flex-col gap-2">
			<div class="flex flex-wrap gap-2 select-none">
				{#each palette as color (color)}
					<button
						class="size-7 rounded-xs cursor-pointer {brushColor === color &&
							'ring-2 ring-ink-dim ring-offset-3 ring-offset-bg'}"
						style={`background: ${color}`}
						aria-label="Brush {color}"
						onclick={() => (brushColor = color)}
					></button>
				{/each}
			</div>
			<div class="flex gap-2 select-none">
				<button
					class="btn btn-sm btn-ghost disabled:opacity-50 text-3xl"
					onclick={undo}
					disabled={undoStack.length === 0}
					title="undo">↺</button
				>
				<button
					class="btn btn-sm btn-ghost disabled:opacity-50 text-3xl"
					onclick={clearCanvas}
					title="clear">⌫</button
				>
				<button
					class="btn btn-sm btn-ghost disabled:opacity-50 text-3xl"
					onclick={randomizeCanvas}
					title="clear">🎲</button
				>
			</div>
		</div>
		{@render children?.()}
	</div>
</div>

<style>
	.grid-lines {
		background-image:
			repeating-linear-gradient(
				90deg,
				rgba(0, 0, 0, 0.08) 0px,
				rgba(0, 0, 0, 0.08) 1px,
				transparent 1px,
				transparent 10%
			),
			repeating-linear-gradient(
				0deg,
				rgba(0, 0, 0, 0.08) 0px,
				rgba(0, 0, 0, 0.08) 1px,
				transparent 1px,
				transparent 10%
			);
	}
</style>
