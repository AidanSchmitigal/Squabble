import { evaluateGuess, updateKeyStates, WORD_LEN, type SquabblePlayer } from '../src/lib/game';
import { ANSWERS } from '../src/lib/assets/answers';

export function healPlayer(player: SquabblePlayer, amount: number) {
	player.hp = Math.min(200, player.hp + amount);
}

export function applyDamage(player: SquabblePlayer, amount: number): boolean {
	player.hp = Math.max(0, player.hp - amount);
	player.damageTaken += amount;
	return player.hp <= 0 && !player.eliminated;
}

export function addGarbage(player: SquabblePlayer, words: string[]) {
	if (player.guesses.length >= 6) return;

	let word: string;
	do {
		word = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
	} while (words.includes(word));

	const answer = words[player.wordIndex % words.length];
	const result = evaluateGuess(word, answer);

	player.guesses.push(word);
	player.garbageMask[player.guesses.length - 1] = true;
	updateKeyStates(player.keyStates, word, result);
}

export function randomAliveOpponent(
	players: SquabblePlayer[],
	excludeId: string
): SquabblePlayer | null {
	const alive = players.filter(
		(p) =>
			p.id !== excludeId &&
			!p.eliminated &&
			p.guesses.length < 5
	);
	if (alive.length === 0) return null;
	return alive[Math.floor(Math.random() * alive.length)];
}

export function advancePlayerWord(player: SquabblePlayer, words: string[]) {
	player.wordIndex++;
	player.guesses = [];
	player.keyStates = {};
	player.garbageMask = new Array(6).fill(false);
	player.healedGreens = new Array(WORD_LEN).fill(false);
	player.healedYellows = [];

	if (player.wordIndex >= words.length) {
		let newWord: string;
		do {
			newWord = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
		} while (words.includes(newWord));
		words.push(newWord);
	}
}

export function eliminatePlayer(
	player: SquabblePlayer,
	players: SquabblePlayer[]
): number {
	player.eliminated = true;
	player.eliminatedAt = Date.now();
	const alive = players.filter((p) => !p.eliminated);
	player.placement = alive.length + 1;
	return alive.length;
}

export function endGame(players: SquabblePlayer[]): { winnerId: string | null } {
	const alive = players.filter((p) => !p.eliminated);
	let winnerId: string | null = null;

	if (alive.length === 1) {
		const winner = alive[0];
		winner.placement = 1;
		winnerId = winner.id;
	}

	const placed = players.filter((p) => p.placement !== null).length;
	const unplaced = players
		.filter((p) => p.placement === null)
		.sort((a, b) => b.hp - a.hp);

	unplaced.forEach((p, i) => {
		p.placement = placed + i + 1;
	});

	return { winnerId };
}

export function isHost(players: SquabblePlayer[], id: string): boolean {
	const player = players.find((p) => p.id === id);
	return player?.isHost ?? false;
}
