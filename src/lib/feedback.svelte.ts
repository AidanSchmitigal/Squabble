let audioContext: AudioContext | undefined;

function getCtx(): AudioContext {
	if (!audioContext) {
		audioContext = new AudioContext();
	}
	if (audioContext.state === 'suspended') {
		audioContext.resume();
	}
	return audioContext;
}

function tone(
	freq: number,
	dur: number,
	type: OscillatorType = 'sine',
	vol: number = 0.05,
	delay: number = 0
) {
	if (typeof window === 'undefined') return;
	if (localStorage.getItem('squabble-sound') === 'false') return;
	const c = getCtx();
	const t0 = c.currentTime + delay;
	const osc = c.createOscillator();
	const g = c.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, t0);
	g.gain.setValueAtTime(0.0001, t0);
	g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
	g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	osc.connect(g);
	g.connect(c.destination);
	osc.start(t0);
	osc.stop(t0 + dur);
}

function sweep(
	startFreq: number,
	endFreq: number,
	dur: number,
	type: OscillatorType = 'sine',
	vol: number = 0.04,
	delay: number = 0
) {
	if (typeof window === 'undefined') return;
	if (localStorage.getItem('squabble-sound') === 'false') return;
	const c = getCtx();
	const t0 = c.currentTime + delay;
	const osc = c.createOscillator();
	const g = c.createGain();
	osc.type = type;
	osc.frequency.setValueAtTime(startFreq, t0);
	osc.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 20), t0 + dur);
	g.gain.setValueAtTime(0.0001, t0);
	g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
	g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
	osc.connect(g);
	g.connect(c.destination);
	osc.start(t0);
	osc.stop(t0 + dur);
}

type Note = { freq: number; dur: number; type?: OscillatorType; vol?: number };
function arpeggio(notes: Note[], stagger: number = 0.1) {
	notes.forEach((note, i) => {
		tone(note.freq, note.dur, note.type ?? 'sine', note.vol ?? 0.05, i * stagger);
	});
}

export function play(kind: string) {
	switch (kind) {
		case 'click':
			tone(700, 0.04, 'sine', 0.04);
			break;
		case 'key':
			tone(440, 0.05, 'sine', 0.035);
			break;
		case 'swoosh':
			sweep(200, 1600, 0.18, 'sine', 0.035);
			break;
		case 'correct':
			tone(660, 0.2, 'sine', 0.055);
			break;
		case 'present':
			tone(500, 0.15, 'triangle', 0.045);
			break;
		case 'absent':
			tone(180, 0.18, 'triangle', 0.035);
			break;
		case 'wrong':
			tone(100, 0.35, 'triangle', 0.05);
			break;
		case 'solve':
			arpeggio(
				[
					{ freq: 392, dur: 0.25, vol: 0.06 },
					{ freq: 494, dur: 0.25, vol: 0.06 },
					{ freq: 587, dur: 0.25, vol: 0.06 },
					{ freq: 784, dur: 0.4, vol: 0.07 }
				],
				0.1
			);
			break;
		case 'damage':
			tone(120, 0.2, 'sine', 0.07);
			break;
		case 'heal':
			arpeggio(
				[
					{ freq: 440, dur: 0.2, vol: 0.05 },
					{ freq: 660, dur: 0.25, vol: 0.05 }
				],
				0.12
			);
			break;
		case 'garbage':
			tone(200, 0.1, 'triangle', 0.04);
			break;
		case 'eliminate':
			sweep(350, 60, 0.6, 'sine', 0.06);
			break;
		case 'victory':
			arpeggio(
				[
					{ freq: 349, dur: 0.3, vol: 0.06 },
					{ freq: 440, dur: 0.3, vol: 0.06 },
					{ freq: 523, dur: 0.3, vol: 0.06 },
					{ freq: 659, dur: 0.3, vol: 0.06 },
					{ freq: 784, dur: 0.5, vol: 0.08 }
				],
				0.12
			);
			break;
	}
}

export function clickFeedback(node: HTMLElement) {
	if (typeof window === 'undefined') return { destroy() {} };

	const style = getComputedStyle(node);
	const isPositioned = style.position === 'absolute' || style.position === 'fixed';

	const wrapper = document.createElement('div');
	wrapper.dataset.haptic = 'true';

	if (isPositioned) {
		wrapper.style.position = style.position;
		wrapper.style.top = style.top;
		wrapper.style.right = style.right;
		wrapper.style.bottom = style.bottom;
		wrapper.style.left = style.left;
		wrapper.style.width = style.width;
		wrapper.style.height = style.height;
		wrapper.style.margin = style.margin;
		wrapper.style.zIndex = style.zIndex;

		node.style.position = 'static';
		node.style.width = '100%';
		node.style.height = '100%';
		node.style.margin = '0';
	} else {
		wrapper.style.cssText = 'position: relative; display: inline-block';
	}

	node.parentNode?.insertBefore(wrapper, node);
	wrapper.appendChild(node);

	node.style.pointerEvents = 'none';

	const input = document.createElement('input');
	input.type = 'checkbox';
	input.setAttribute('switch', '');
	input.style.cssText = `
		position: absolute; inset: 0; width: 100%; height: 100%;
		margin: 0; opacity: 0; cursor: pointer;
		clip-path: inset(0 round 999px);
		-webkit-tap-highlight-color: transparent;
		touch-action: manipulation;
	`;

	input.addEventListener('change', () => {
		input.checked = false;
		navigator.vibrate?.(8);
		play('click');
		node.click();
	});

	wrapper.appendChild(input);

	return {
		destroy() {
			input.remove();
			node.style.pointerEvents = '';
			if (isPositioned) {
				node.style.position = style.position;
				node.style.top = style.top;
				node.style.right = style.right;
				node.style.bottom = style.bottom;
				node.style.left = style.left;
				node.style.width = style.width;
				node.style.height = style.height;
				node.style.margin = style.margin;
			}
			wrapper.parentNode?.insertBefore(node, wrapper);
			wrapper.remove();
		}
	};
}
