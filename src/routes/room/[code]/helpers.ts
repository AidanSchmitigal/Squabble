import type { Avatar } from '$lib/game';

export const PALETTE = [
	'#ffffff', '#0e0e10', '#e5484d', '#5ab552',
	'#d7b740', '#8235f5', '#3a86ff', '#f2a65a', '#a85bd6', '#5e5e64'
];

export function drawAvatar(node: HTMLCanvasElement, data: Avatar) {
	const size = 10;
	node.width = size;
	node.height = size;
	const ctx = node.getContext('2d')!;
	ctx.fillStyle = '#ffffff';
	ctx.fillRect(0, 0, size, size);
	if (!data) return;
	for (let i = 0; i < size * size; i++) {
		const c = data[i];
		if (c) {
			ctx.fillStyle = c;
			ctx.fillRect(i % size, Math.floor(i / size), 1, 1);
		}
	}
	return {
		update(newData: Avatar) {
			drawAvatar(node, newData);
		}
	};
}

export function drawQR(node: HTMLCanvasElement, text: string) {
	const N = 21;
	node.width = N * 4;
	node.height = N * 4;
	const ctx = node.getContext('2d')!;
	ctx.fillStyle = '#fff';
	ctx.fillRect(0, 0, node.width, node.height);
	let seed = 0;
	for (const ch of text) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
	function rnd() { seed = (seed * 1103515245 + 12345) >>> 0; return (seed >>> 16) / 65535; }
	ctx.fillStyle = '#111';
	for (let y = 0; y < N; y++) {
		for (let x = 0; x < N; x++) {
			const inFinder = (x < 6 && y < 6) || (x > N - 7 && y < 6) || (x < 6 && y > N - 7);
			if (inFinder) continue;
			if (rnd() < 0.46) ctx.fillRect(x * 4, y * 4, 4, 4);
		}
	}
	[[0, 0], [N - 7, 0], [0, N - 7]].forEach(([fx, fy]) => {
		ctx.fillStyle = '#111';
		ctx.fillRect(fx * 4, fy * 4, 28, 28);
		ctx.fillStyle = '#fff';
		ctx.fillRect((fx + 1) * 4, (fy + 1) * 4, 20, 20);
		ctx.fillStyle = '#111';
		ctx.fillRect((fx + 2) * 4, (fy + 2) * 4, 12, 12);
	});
}

export function hpClass(hp: number) {
	if (hp <= 30) return 'low';
	if (hp <= 60) return 'mid';
	return '';
}

export function toastMsg(msg: string) {
	const wrap = document.getElementById('toastWrap');
	if (!wrap) return;
	const el = document.createElement('div');
	el.className = 'toast';
	el.textContent = msg;
	wrap.appendChild(el);
	setTimeout(() => el.remove(), 2800);
}
