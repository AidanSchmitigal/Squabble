<script lang="ts">
	let {
		initialDrawing = '',
		avatar = false,
		disabled = false,
		onupdate = () => {},
		oninstant = () => {}
	}: {
		initialDrawing?: string;
		avatar?: boolean;
		disabled?: boolean;
		onupdate?: (url: string) => void;
		oninstant?: (url: string) => void;
	} = $props();

	const palette = ['#3a332c', '#ff6b5b', '#52bfee', '#7bc95e', '#b083e8', '#ffc83d', '#fffef9'];
	const thinSize = 6;
	const thickSize = 12;
	const CANVAS_WIDTH = 100;

	let avatarCanvas = $state<HTMLCanvasElement>();
	let brushColor = $state(palette[0]);
	let brushSize = $state(thickSize);
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
		// @ts-expect-error - mozilla
		context.mozImageSmoothingEnabled = false;
		// @ts-expect-error - webkit
		context.webkitImageSmoothingEnabled = false;
		context.lineCap = 'round';
		context.lineJoin = 'round';
		context.fillStyle = '#fffef9';
		context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
		if (initialDrawing) {
			const image = new Image();
			image.onload = () => context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_WIDTH);
			image.src = initialDrawing;
		}
	}

	function pointFromEvent(event: PointerEvent) {
		if (!avatarCanvas) return { x: 0, y: 0 };
		const rect = avatarCanvas.getBoundingClientRect();
		return {
			x: (event.clientX - rect.left) * (CANVAS_WIDTH / rect.width),
			y: (event.clientY - rect.top) * (CANVAS_WIDTH / rect.height)
		};
	}

	function startStroke(event: PointerEvent) {
		if (!avatarCanvas || disabled) return;
		undoStack.push(avatarCanvas.toDataURL('image/png'));
		avatarCanvas.setPointerCapture(event.pointerId);
		drawing = true;
		lastPoint = pointFromEvent(event);
	}

	function drawStroke(event: PointerEvent) {
		if (!avatarCanvas || !drawing || !lastPoint) return;
		const point = pointFromEvent(event);
		const context = avatarCanvas.getContext('2d');
		if (!context) return;
		context.strokeStyle = brushColor;
		context.lineWidth = brushSize;
		context.beginPath();
		context.moveTo(lastPoint.x, lastPoint.y);
		context.lineTo(point.x, point.y);
		context.stroke();
		lastPoint = point;
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
		if (disabled) return;
		const context = avatarCanvas?.getContext('2d');
		if (!context || !avatarCanvas) return;
		undoStack.push(avatarCanvas.toDataURL('image/png'));
		const rect = avatarCanvas.getBoundingClientRect();
		context.fillStyle = '#fffef9';
		context.fillRect(0, 0, rect.width, rect.height);
		onupdate('');
	}

	function handleKeydown(event: KeyboardEvent) {
		if (disabled) return;
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
		if (disabled || undoStack.length === 0) return;
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
</script>

<div class="flex justify-center mt-2 mb-4 {disabled ? 'opacity-40' : ''}">
	<div
		class="ink flex relative items-center justify-center shrink-0 w-full aspect-square bg-coral overflow-clip {avatar &&
			'blob1'} {disabled ? 'pointer-events-none' : ''}"
		id="ccPreview"
	>
		<div class="size-full overflow-clip">
			<canvas
				class="size-full block touch-none"
				use:prepareCanvas
				onpointerdown={startStroke}
				onpointermove={drawStroke}
				onpointerup={endStroke}
				onpointercancel={endStroke}
			></canvas>
		</div>
	</div>
</div>
<div class="flex items-center gap-2 mt-4 justify-center flex-wrap {disabled ? 'opacity-40 pointer-events-none' : ''}">
	{#each palette as color (color)}
		<button
			class="size-7 rounded-full border-3 border-ink cursor-pointer {brushColor === color &&
				'ring-3 ring-ink ring-offset-3'}"
			style={`background: ${color}`}
			aria-label="Brush {color}"
			onclick={() => (brushColor = color)}
		></button>
	{/each}
</div>
<div class="flex items-center gap-2 my-2.5 justify-center flex-wrap {disabled ? 'opacity-40 pointer-events-none' : ''}">
	<button
		class="size-10 border-3 border-ink cursor-pointer rounded-xl flex items-center justify-center text-3xl bg-white"
		class:bg-yellow={brushSize === thinSize}
		onclick={() => (brushSize = thinSize)}
		title="thin brush">·</button
	>
	<button
		class="size-10 border-3 border-ink cursor-pointer rounded-xl flex items-center justify-center text-3xl bg-white"
		class:bg-yellow={brushSize === thickSize}
		onclick={() => (brushSize = thickSize)}
		title="thick brush"
	>
		●
	</button>
	<button
		class="size-10 border-3 border-ink cursor-pointer rounded-xl flex items-center justify-center text-3xl bg-white disabled:opacity-50"
		onclick={undo}
		disabled={undoStack.length === 0 || disabled}
		title="undo">↺</button
	>
	<button
		class="size-10 border-3 border-ink cursor-pointer rounded-xl flex items-center justify-center text-2xl bg-white"
		onclick={clearCanvas}
		disabled={disabled}
		title="clear">⌫</button
	>
</div>
