export class Counter {
	#current;
	#rate;

	#running = false;
	#raf = 0;
	#last = 0;

	/**
	 * @param {number} value
	 * @param {{ rate?: number, autoStart?: boolean }} [options]
	 */
	constructor(
		value = 0,
		options: {
			rate?: number;
			autoStart?: boolean;
		} = {}
	) {
		const { rate = 1, autoStart = true } = options;

		this.#current = $state(value);
		this.#rate = rate;

		if (autoStart) {
			this.start();
		}
	}

	#tick = (now: number) => {
		if (!this.#running) return;

		const dt = (now - this.#last) / 1000;
		this.#last = now;

		this.#current += this.#rate * dt;

		this.#raf = requestAnimationFrame(this.#tick);
	};

	/**
	 * Start counting.
	 * @param {number} [rate]
	 */
	start(rate = this.#rate) {
		this.#rate = rate;

		if (this.#running) return;
		this.#running = true;
		this.#last = performance.now();
		this.#raf = requestAnimationFrame(this.#tick);
	}

	stop() {
		this.#running = false;
		cancelAnimationFrame(this.#raf);
	}

	/**
	 * Reset the counter to a specific value.
	 * @param {number} value
	 */
	reset(value = 0) {
		this.#current = value;
		this.#last = performance.now();
	}

	/**
	 * Change the rate while running or stopped.
	 * Negative values count down.
	 * @param {number} rate
	 */
	setRate(rate: number) {
		this.#rate = rate;
	}

	get current() {
		return this.#current;
	}

	set current(value) {
		this.reset(value);
	}

	get rate() {
		return this.#rate;
	}

	set rate(value) {
		this.setRate(value);
	}
}
