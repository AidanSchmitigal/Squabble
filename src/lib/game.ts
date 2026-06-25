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
	damageDealt: number;
	damageTaken: number;
	eliminatedAt: number | null;
	guesses: string[];
	keyStates: Record<string, TileResult>;
	miniGrid: boolean[];
	garbageMask: boolean[];
	healedGreens: boolean[];
	healedYellows: string[];
};

export type GameState = {
	roomCode: string;
	phase: GamePhase;
	settings: GameSettings;
	players: SquabblePlayer[];
	words: string[];
	aliveCount: number;
	winnerId: string | null;
	gameStartedAt: number | null;
	gameEndedAt: number | null;
};

export type ClientMessage =
	| { type: 'join'; name?: string; avatar?: Avatar; playerId?: string }
	| { type: 'set-player'; name?: string; avatar?: Avatar }
	| { type: 'start-game' }
	| { type: 'submit-guess'; guess: string }
	| { type: 'update-settings'; settings: Partial<GameSettings> }
	| { type: 'play-again' };

export type ServerMessage =
	| { type: 'hello'; id: string }
	| { type: 'state'; state: GameState }
	| { type: 'error'; message: string }
	| { type: 'suggest-room'; roomCode: string | null };

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
			const target = i + size + shift;
			if (target >= 0 && target < size * size) {
				avatar[target] = c;
			}
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

export const WORD_LEN = 5;

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

export function updateKeyStates(
	keyStates: Record<string, TileResult>,
	guess: string,
	result: TileResult[]
): void {
	guess.split('').forEach((ch, i) => {
		const cur = keyStates[ch];
		const rank: Record<string, number> = { absent: 0, present: 1, correct: 2 };
		if (!cur || rank[result[i]] > rank[cur]) keyStates[ch] = result[i];
	});
}

export function getHpColorClass(hp: number, eliminated: boolean): 'red' | 'yellow' | 'green' {
	if (eliminated || hp <= 30) return 'red';
	if (hp <= 60) return 'yellow';
	return 'green';
}

export function nextRoomCode(code: string): string {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	const chars = code.split('');
	for (let i = chars.length - 1; i >= 0; i--) {
		const idx = alphabet.indexOf(chars[i]);
		if (idx < alphabet.length - 1) {
			chars[i] = alphabet[idx + 1];
			return chars.join('');
		}
		chars[i] = alphabet[0];
	}
	return alphabet[0].repeat(code.length);
}
