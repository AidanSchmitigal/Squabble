import { shuffleArray } from '$lib';

export type Phase = 'lobby' | 'study' | 'draw' | 'reveal' | 'scores' | 'finished';

export type Vote = {
	voterId: string;
	rankings: string[];
};

export type PlayerPoints = {
	playerId: string;
	points: number;
};

export type Angles = 'Red' | 'Green' | 'Blue' | 'Yellow' | 'Cyan' | 'Magenta';

export type Avatar = {
	drawing: string;
};

export type Player = {
	id: string;
	name: string;
	avatar: Avatar;
	score: number;
	connected: boolean;
	joinedAt: number;
	drawing?: string;
	done?: boolean;
};

export type Challenge = {
	id: string;
	name: string;
	prompt: string;
	targetAngle: Angles;
	model: string;
	rotation: [number, number, number];
};

export type GameSettings = {
	showGrid: boolean;
	randomRotations: boolean;
};

export type GameState = {
	roomCode: string;
	phase: Phase;
	round: number;
	presenterId: string | null;
	challenge: Challenge;
	players: Player[];
	votes: Vote[];
	updatedAt: number;
	phaseStartedAt: number;
	settings: GameSettings;
};

export type ClientMessage =
	| { type: 'join'; name: string; avatar: Avatar }
	| { type: 'set-player'; name?: string; avatar?: Avatar }
	| { type: 'phase'; phase: Phase }
	| { type: 'next-round' }
	| { type: 'drawing'; dataUrl: string }
	| { type: 'clear-drawing' }
	| { type: 'done'; done: boolean }
	| { type: 'submit-vote'; rankings: string[] }
	| { type: 'score'; playerId: string; delta: number }
	| { type: 'reset' }
	| { type: 'update-settings'; settings: Partial<GameSettings> };

export type ServerMessage = { type: 'state'; state: GameState } | { type: 'hello'; id: string };

export const STUDY_DURATION = 10;
export const DRAW_DURATION = 60;
export const VOTING_DURATION = 30;
export const ROUND_COUNT = 5;
export const POINTS_PER_RANK = [3, 2, 1];

const models: { name: string; validAngles: Angles[] }[] = [
	{ name: '01', validAngles: ['Red', 'Blue', 'Yellow', 'Cyan'] },
	// { name: '02', validAngles: [] }, Remove
	{ name: '03', validAngles: ['Red', 'Green', 'Magenta'] },
	{ name: '04', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '05', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '06', validAngles: ['Red', 'Green', 'Blue', 'Magenta'] },
	{ name: '07', validAngles: ['Red', 'Blue', 'Yellow', 'Cyan'] },
	{ name: '08', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '09', validAngles: ['Green', 'Yellow', 'Magenta'] },
	{ name: '10', validAngles: ['Red', 'Blue', 'Yellow'] },
	{ name: '11', validAngles: ['Red', 'Blue', 'Yellow'] },
	{ name: '12', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '13', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '14', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '15', validAngles: ['Red', 'Green', 'Blue', 'Yellow'] },
	{ name: '16', validAngles: ['Blue', 'Yellow', 'Magenta'] },
	{ name: '17', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	// { name: '18', validAngles: [] }, Remove
	// { name: '19', validAngles: [] }, Remove
	// { name: '20', validAngles: [] }, Remove
	{ name: '21', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '22', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '23', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '24', validAngles: ['Red', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '25', validAngles: ['Red', 'Blue', 'Yellow'] },
	{ name: '26', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '27', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '28', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '29', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '30', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '31', validAngles: ['Red', 'Blue', 'Yellow', 'Cyan'] },
	{ name: '32', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '33', validAngles: ['Blue', 'Yellow'] },
	{ name: '34', validAngles: ['Blue', 'Yellow'] },
	{ name: '35', validAngles: ['Red', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '36', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '37', validAngles: ['Red', 'Blue', 'Yellow', 'Magenta'] },
	{ name: '38', validAngles: ['Red', 'Green', 'Blue', 'Cyan', 'Magenta'] },
	{ name: '39', validAngles: ['Blue', 'Yellow'] },
	{ name: '40', validAngles: ['Blue', 'Yellow'] },
	{ name: '41', validAngles: ['Red', 'Blue', 'Yellow'] },
	{ name: '42', validAngles: ['Red', 'Green', 'Cyan', 'Magenta'] },
	{ name: '43', validAngles: ['Red', 'Green', 'Cyan', 'Magenta'] },
	{ name: '44', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '45', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '46', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '47', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '48', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '49', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '50', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '51', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '52', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '53', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '54', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '55', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '56', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '57', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '58', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '59', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '60', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '61', validAngles: ['Red', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '62', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '63', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '64', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '65', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '66', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '67', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '68', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '69', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '70', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '71', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '72', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '73', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '74', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '75', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '76', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '77', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '78', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '79', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '80', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '81', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] },
	{ name: '82', validAngles: ['Red', 'Green', 'Blue', 'Yellow', 'Cyan', 'Magenta'] }
];

export const challenges: Challenge[] = shuffleArray(
	models.map((model) => ({
		id: `model-${model.name}`,
		name: `Shape ${model.name}`,
		prompt: 'Study the 3D shape from every angle.',
		targetAngle: model.validAngles[Math.floor(Math.random() * model.validAngles.length)],
		model: `/models/${model.name}.glb`,
		rotation: [
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2
		] as [number, number, number]
	}))
).slice(0, ROUND_COUNT);

export function makeRoomCode() {
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	let code = '';
	for (let index = 0; index < 4; index += 1) {
		code += alphabet[Math.floor(Math.random() * alphabet.length)];
	}
	return code;
}

export function makeAvatar() {
	return { drawing: '' } satisfies Avatar;
}

const defaultNames = ['Squiggle', 'Doodle', 'Wobble', 'Noodle', 'Zigzag', 'Pebble'];

export function sanitizeName(name: string) {
	const clean = name.trim().replace(/\s+/g, ' ').slice(0, 18);
	return clean || defaultNames[Math.floor(Math.random() * defaultNames.length)];
}

export function getTimeRemaining(phase: Phase, startedAt: number, now?: number) {
	now ??= Date.now();
	let duration = 0;
	switch (phase) {
		case 'study':
			duration = STUDY_DURATION;
			break;
		case 'draw':
			duration = DRAW_DURATION;
			break;
		case 'reveal':
			duration = VOTING_DURATION;
			break;
		default:
			break;
	}
	const remaining = Math.max(0, duration * 1000 - (now - startedAt));
	const totalSeconds = Math.ceil(remaining / 1000);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}
