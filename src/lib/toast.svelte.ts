type Toast = { id: number; msg: string };

let toasts = $state<Toast[]>([]);
let nextId = 0;

export function toastMsg(msg: string) {
	const id = nextId++;
	toasts = [...toasts, { id, msg }];
	setTimeout(() => {
		toasts = toasts.filter((t) => t.id !== id);
	}, 2800);
}

export function getToasts() {
	return toasts;
}
