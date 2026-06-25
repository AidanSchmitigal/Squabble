export type Avatar = string;

export type TileResult = 'absent' | 'present' | 'correct';

export type GamePhase = 'lobby' | 'playing' | 'finished';

export type GameSettings = {
	dmgTick: number;
};

export type SquabblePlayer = {
	id: string;
	name: string;
	avatar: Avatar;
	isHost: boolean;
	connected: boolean;
	hp: number;
	eliminated: boolean;
	placement: number | null;
	wordIndex: number;
	wordsSolved: number;
	guesses: string[];
	keyStates: Record<string, TileResult>;
	miniGrid: boolean[];
};

export type GameState = {
	roomCode: string;
	phase: GamePhase;
	settings: GameSettings;
	players: SquabblePlayer[];
	words: string[];
	aliveCount: number;
	winnerId: string | null;
};

export type ClientMessage =
	| { type: 'join'; name: string; avatar: Avatar }
	| { type: 'set-player'; name?: string; avatar?: Avatar }
	| { type: 'start-game' }
	| { type: 'submit-guess'; guess: string }
	| { type: 'update-settings'; settings: Partial<GameSettings> };

export type ServerMessage =
	| { type: 'hello'; id: string }
	| { type: 'state'; state: GameState }
	| { type: 'error'; message: string };

export function makeRoomCode(): string {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	let code = '';
	for (let i = 0; i < 4; i++) {
		code += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return code;
}

export const EMPTY_AVATAR =
	'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAIUlEQVR4AezQMQ0AAADCMIJ/z+CATAC7d9WBWbCPEwrzFAAA//+q4AtiAAAABklEQVQDALXgJ+0xUinGAAAAAElFTkSuQmCC';

export function randomAvatar(size = 10): string[] {
	const palette = ['#1a1a1a', '#ff0077', '#fff955', '#44c183', '#176de6', '#b752cb'].slice(
		Math.floor(Math.random() * 3),
		3 + Math.floor(Math.random() * 3)
	);
	const shift = Math.random() < 0.5 ? 1 : -1;
	const avatar = new Array(size * size)
		.fill(null)
		.map(() => (Math.random() < 0.1 ? palette[Math.floor(Math.random() * palette.length)] : null));
	for (let i = 0; i < size * size; i++) {
		const c = avatar[i];
		if (c == null) {
			avatar[i] = '#ffffff';
		} else {
			avatar[i + size + shift] = c;
		}
	}
	return avatar as string[];
}

export function sanitizeName(name: string): string {
	const defaults = ['Pixel', 'Nova', 'Ziggy', 'Quokka', 'Mochi', 'Sable', 'Tango', 'Wisp'];
	const clean = name.trim().replace(/\s+/g, ' ').slice(0, 18);
	return clean || defaults[Math.floor(Math.random() * defaults.length)];
}

export const BOT_NAMES = [
	'Pixel',
	'Nova',
	'Ziggy',
	'Quokka',
	'Mochi',
	'Sable',
	'Tango',
	'Wisp',
	'Juno',
	'Remy',
	'Echo',
	'Birdie',
	'Otter',
	'Finch',
	'Koda',
	'Vex'
];

export const ANSWERS_5 = ['CRANE'];

export const ALLOWED_5 = new Set([...ANSWERS_5, 'ABOUT']);

export function evaluateGuess(guess: string, answer: string): TileResult[] {
	const res: TileResult[] = new Array(guess.length).fill('absent');
	const aLetters = answer.split('');
	const used = new Array(answer.length).fill(false);
	for (let i = 0; i < guess.length; i++) {
		if (guess[i] === answer[i]) {
			res[i] = 'correct';
			used[i] = true;
		}
	}
	for (let i = 0; i < guess.length; i++) {
		if (res[i] === 'correct') continue;
		const idx = aLetters.findIndex((c, j) => c === guess[i] && !used[j]);
		if (idx !== -1) {
			res[i] = 'present';
			used[idx] = true;
		}
	}
	return res;
}

export const DEFAULT_SETTINGS: GameSettings = {
	dmgTick: 1
};
