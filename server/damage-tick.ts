export function createDamageManager() {
	const timers = new Map<string, ReturnType<typeof setInterval>>();

	function start(
		playerId: string,
		intervalMs: number,
		onTick: () => void
	) {
		stop(playerId);
		const timer = setInterval(onTick, Math.max(1000, intervalMs));
		timers.set(playerId, timer);
	}

	function stop(playerId: string) {
		const timer = timers.get(playerId);
		if (timer) {
			clearInterval(timer);
			timers.delete(playerId);
		}
	}

	function stopAll() {
		for (const [id] of timers) {
			stop(id);
		}
	}

	return { start, stop, stopAll };
}
