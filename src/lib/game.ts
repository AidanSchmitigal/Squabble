export type Avatar = (string | null)[];

export type TileResult = 'absent' | 'present' | 'correct';

export type GameMode = 'Blitz' | 'Royale';
export type WordList = 'common' | 'expanded' | 'spicy';
export type GamePhase = 'lobby' | 'playing' | 'finished';

export type GameSettings = {
	mode: GameMode;
	wordLen: number;
	wordList: WordList;
	dmgTick: number;
	maxPlayers: number;
	private: boolean;
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

export function makeAvatar(size = 10): Avatar {
	return new Array(size * size).fill(null);
}

export function randomAvatar(size = 10): Avatar {
	const palette = ['#ffffff', '#e5484d', '#5ab552', '#d7b740', '#8235f5', '#3a86ff', '#f2a65a', '#5e5e64'];
	return new Array(size * size).fill(null).map(() =>
		Math.random() < 0.5 ? palette[Math.floor(Math.random() * palette.length)] : null
	);
}

export function sanitizeName(name: string): string {
	const defaults = ['Pixel', 'Nova', 'Ziggy', 'Quokka', 'Mochi', 'Sable', 'Tango', 'Wisp'];
	const clean = name.trim().replace(/\s+/g, ' ').slice(0, 18);
	return clean || defaults[Math.floor(Math.random() * defaults.length)];
}

export const BOT_NAMES = ['Pixel', 'Nova', 'Ziggy', 'Quokka', 'Mochi', 'Sable', 'Tango', 'Wisp', 'Juno', 'Remy', 'Echo', 'Birdie', 'Otter', 'Finch', 'Koda', 'Vex'];

export const ANSWERS_5 = [
	'CRANE', 'SLATE', 'BRISK', 'PLUME', 'GROVE', 'FLINT', 'QUART', 'WHISK', 'CHORD', 'GLAZE',
	'PRISM', 'VIVID', 'MIRTH', 'SNOUT', 'BLAZE', 'TRYST', 'GUMBO', 'OXIDE', 'NYMPH', 'QUILT'
];

export const ALLOWED_5 = new Set([
	...ANSWERS_5,
	'ABOUT', 'OTHER', 'WHICH', 'THEIR', 'WOULD', 'THESE', 'CLICK', 'BOARD', 'LEARN', 'SOUND',
	'GREAT', 'FIGHT', 'LIGHT', 'MIGHT', 'RIGHT', 'TIGHT', 'SIGHT', 'NIGHT', 'WORLD', 'HOUSE',
	'MOUSE', 'TRACE', 'PLACE', 'SPACE', 'GRACE', 'BRAVE', 'CRAVE', 'STONE', 'SHINE', 'SHADE',
	'TRADE', 'GRADE', 'ADIEU', 'AUDIO', 'CANOE', 'CHASE', 'DANCE', 'DOUBT', 'DREAM', 'DRINK',
	'DRIVE', 'EARTH', 'ENJOY', 'EVERY', 'FAINT', 'FEAST', 'FLAME', 'FLOAT', 'FLUTE', 'FROST',
	'GHOST', 'GLARE', 'GLEAM', 'GLOOM', 'HAPPY', 'HEART', 'HUMOR', 'JUICE', 'KNIFE', 'LARGE',
	'LAUGH', 'LEMON', 'LOVELY', 'MAGIC', 'MANGO', 'MERCY', 'MIMIC', 'MONEY', 'MOUTH', 'MUSIC',
	'NEVER', 'OCEAN', 'OFFER', 'OLIVE', 'PEACE', 'PEARL', 'PENNY', 'PILOT', 'PIXEL', 'POWER',
	'QUEEN', 'QUERY', 'QUEST', 'QUOTA', 'RAISE', 'RANCH', 'RHYME', 'ROBOT', 'ROCKY', 'ROUGE',
	'ROUND', 'SALAD', 'SALSA', 'SCALE', 'SCARE', 'SCENE', 'SCOPE', 'SCORE', 'SNAKE', 'SOLAR',
	'SPARK', 'SPICE', 'SPINE', 'SPLIT', 'SPRAY', 'SQUAD', 'STACK', 'STAFF', 'STAGE', 'STAIN',
	'STALE', 'STALL', 'STARK', 'STEAM', 'STICK', 'STILL', 'STOCK', 'STONE', 'STORM', 'STORY',
	'STRIP', 'STUCK', 'STUDY', 'STUFF', 'STYLE', 'SUGAR', 'SUITE', 'SUNNY', 'SUPER', 'SURGE',
	'SWAMP', 'SWEET', 'SWIFT', 'SWING', 'TABLE', 'TASTE', 'TEACH', 'TENOR', 'THEME', 'THICK',
	'THIEF', 'THING', 'THINK', 'THORN', 'TIDAL', 'TIGER', 'TODAY', 'TOWER', 'TRAIN', 'TRASH',
	'TREAT', 'TREND', 'TRIAL', 'TRIBE', 'TRICK', 'TROOP', 'TRUCK', 'TRULY', 'TRUST', 'TRUTH',
	'TWEED', 'TWICE', 'TWIST', 'ULCER', 'UNCLE', 'UNDER', 'UNION', 'UNITE', 'UNITY', 'UNTIE',
	'USAGE', 'USHER', 'USUAL', 'UTTER', 'VALID', 'VALUE', 'VAPOR', 'VAULT', 'VENUS', 'VERSE',
	'VIDEO', 'VIGOR', 'VINYL', 'VIOLA', 'VIPER', 'VIRAL', 'VISIT', 'VISTA', 'VITAL', 'VIVID',
	'VOCAL', 'VODKA', 'VOICE', 'VOWEL', 'WASTE', 'WATCH', 'WATER', 'WEARY', 'WEAVE', 'WEDGE',
	'WEIGH', 'WEIRD', 'WHEAT', 'WHEEL', 'WHISK', 'WHITE', 'WHOLE', 'WIDEN', 'WIDTH', 'WITCH',
	'WOMAN', 'WORLD', 'WORRY', 'WORSE', 'WORST', 'WORTH', 'WOULD', 'WOUND', 'WRATH', 'WRITE',
	'WRONG', 'WROTE', 'YACHT', 'YEARN', 'YOUTH', 'ZEBRA', 'ZESTY', 'ZONED'
]);

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
	mode: 'Blitz',
	wordLen: 5,
	wordList: 'common',
	dmgTick: 1,
	maxPlayers: 99,
	private: false
};
