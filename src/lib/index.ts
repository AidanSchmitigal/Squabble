// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Procedure = (...args: any[]) => any;

export function debounce<T extends Procedure>(fn: T, delay: number) {
	let timeout: ReturnType<typeof setTimeout> | null = null;
	return (...args: Parameters<T>) => {
		if (timeout) clearTimeout(timeout);
		timeout = setTimeout(() => {
			timeout = null;
			fn(...args);
		}, delay);
	};
}

export function throttle<T extends Procedure>(
	func: T,
	limit: number
): (...args: Parameters<T>) => void {
	let inThrottle = false;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return function (this: any, ...args: Parameters<T>): void {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;

			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
}

export function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
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
