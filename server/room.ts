import { WebSocket } from 'ws';
import {
	DEFAULT_SETTINGS,
	EMPTY_AVATAR,
	evaluateGuess,
	sanitizeName,
	WORD_LEN,
	type Avatar,
	type GamePhase,
	type GameSettings,
	type GameState,
	type ServerMessage,
	type SquabblePlayer
} from '../src/lib/game';
import { ANSWERS } from '../src/lib/assets/answers';
import { VALID } from '../src/lib/assets/valid';

export class GameRoom {
	roomCode: string;
	phase: GamePhase = 'lobby';
	settings: GameSettings = { ...DEFAULT_SETTINGS };
	players: SquabblePlayer[] = [];
	words: string[] = [];
	aliveCount = 0;
	winnerId: string | null = null;
	gameStartedAt: number | null = null;
	gameEndedAt: number | null = null;

	connections = new Map<string, WebSocket>();
	private spectatorIds = new Set<string>();
	private damageTimers = new Map<string, ReturnType<typeof setInterval>>();

	constructor(roomCode: string) {
		this.roomCode = roomCode;
	}

	get isEmpty() {
		return this.connections.size === 0;
	}

	get selfState(): GameState {
		return {
			roomCode: this.roomCode,
			phase: this.phase,
			settings: this.settings,
			words: this.words,
			players: this.players,
			aliveCount: this.aliveCount,
			winnerId: this.winnerId,
			gameStartedAt: this.gameStartedAt,
			gameEndedAt: this.gameEndedAt
		};
	}

	addConnection(ws: WebSocket): string {
		const id = crypto.randomUUID();
		this.connections.set(id, ws);

		if (this.phase !== 'lobby') {
			this.spectatorIds.add(id);
		}

		ws.send(JSON.stringify({ type: 'hello', id } satisfies ServerMessage));
		this.broadcastState();
		return id;
	}

	removeConnection(id: string) {
		this.connections.delete(id);
		this.spectatorIds.delete(id);
		this.stopDamageTick(id);

		const player = this.players.find((p) => p.id === id);
		if (player) {
			player.connected = false;
		}

		if (this.phase === 'playing') {
			this.checkElimination(id);
		}

		this.broadcastState();
	}

	handleMessage(message: string, senderId: string) {
		let parsed: import('../src/lib/game').ClientMessage;
		try {
			parsed = JSON.parse(message) as import('../src/lib/game').ClientMessage;
		} catch {
			return;
		}

		// Spectators can only spectate — reject all game actions
		if (this.spectatorIds.has(senderId) && parsed.type !== 'join') return;

		switch (parsed.type) {
			case 'join':
				this.handleJoin(senderId, parsed.name, parsed.avatar, parsed.playerId);
				break;
			case 'set-player':
				this.handleSetPlayer(senderId, parsed.name, parsed.avatar);
				break;
			case 'start-game':
				this.handleStartGame(senderId);
				break;
			case 'submit-guess':
				this.handleSubmitGuess(senderId, parsed.guess);
				break;
			case 'update-settings':
				if (this.isHost(senderId)) {
					Object.assign(this.settings, parsed.settings);
				}
				break;
		}

		this.broadcastState();
	}

	/* ---------- Handlers ---------- */

	private handleJoin(senderId: string, name?: string, avatar?: Avatar, playerId?: string) {
		// Reconnect path
		if (playerId) {
			const existing = this.players.find((p) => p.id === playerId);
			if (!existing) return;

			// Update player ID to match the new connection key
			existing.id = senderId;
			existing.connected = true;
			if (name) existing.name = sanitizeName(name);
			if (avatar) existing.avatar = avatar;

			this.spectatorIds.delete(senderId);
			this.stopDamageTick(playerId);

			const ws = this.connections.get(senderId);
			if (ws) {
				ws.send(JSON.stringify({ type: 'hello', id: senderId } satisfies ServerMessage));
			}
			return;
		}

		// New join — only allowed during lobby
		if (this.phase !== 'lobby') {
			this.spectatorIds.add(senderId);
			return;
		}

		this.spectatorIds.delete(senderId);

		const existing = this.players.find((p) => p.id === senderId);
		if (existing) {
			if (name) existing.name = sanitizeName(name);
			if (avatar) existing.avatar = avatar;
			existing.connected = true;
			return;
		}

		const finalName = sanitizeName(name || 'Player');
		const isHost = this.players.length === 0;

		this.players.push({
			id: senderId,
			name: finalName,
			avatar: avatar ?? EMPTY_AVATAR,
			isHost,
			connected: true,
			hp: 100,
			eliminated: false,
			placement: null,
			wordIndex: 0,
			wordsSolved: 0,
			damageDealt: 0,
			damageTaken: 0,
			eliminatedAt: null,
			guesses: [],
			keyStates: {},
			miniGrid: new Array(WORD_LEN * 6).fill(false),
			garbageMask: new Array(6).fill(false)
		});
	}

	private handleSetPlayer(id: string, name?: string, avatar?: Avatar) {
		const player = this.players.find((p) => p.id === id);
		if (!player) return;
		if (name) player.name = sanitizeName(name);
		if (avatar) player.avatar = avatar;
		this.broadcastState();
	}

	private handleStartGame(senderId: string) {
		if (!this.isHost(senderId)) return;
		if (this.phase !== 'lobby') return;

		this.phase = 'playing';
		this.words = [ANSWERS[Math.floor(Math.random() * ANSWERS.length)]];
		this.aliveCount = this.players.length;
		this.winnerId = null;
		this.gameStartedAt = Date.now();

		for (const p of this.players) {
			p.hp = 100;
			p.eliminated = false;
			p.placement = null;
			p.wordIndex = 0;
			p.wordsSolved = 0;
			p.damageDealt = 0;
			p.damageTaken = 0;
			p.eliminatedAt = null;
			p.guesses = [];
			p.keyStates = {};
			p.miniGrid = new Array(WORD_LEN * 6).fill(false);
			p.garbageMask = new Array(6).fill(false);
			this.startDamageTick(p.id);
		}
	}

	private handleSubmitGuess(senderId: string, guess: string) {
		if (this.phase !== 'playing') return;

		const player = this.players.find((p) => p.id === senderId);
		if (!player || player.eliminated) return;

		if (guess.length !== WORD_LEN) return;
		if (!VALID.has(guess)) return;

		const answer = this.words[player.wordIndex % this.words.length];
		const result = evaluateGuess(guess, answer);

		player.guesses.push(guess);

		guess.split('').forEach((ch, i) => {
			const cur = player.keyStates[ch];
			const rank: Record<string, number> = { absent: 0, present: 1, correct: 2 };
			if (!cur || rank[result[i]] > rank[cur]) player.keyStates[ch] = result[i];
		});

		const solved = result.every((r) => r === 'correct');

		if (solved) {
			this.handleWordSolved(player);
		} else if (player.guesses.length >= 6) {
			this.applyDamage(player, 18);
			this.advancePlayerWord(player);
		} else {
			this.applyDamage(player, 6);
		}
	}

	/* ---------- Game logic ---------- */

	private handleWordSolved(player: SquabblePlayer) {
		player.wordsSolved++;
		this.healPlayer(player, 22);

		const target = this.randomAliveOpponent(player.id);
		if (target) {
			const dmg = 16 + Math.floor(Math.random() * 10);
			player.damageDealt += dmg;
			this.applyDamage(target, dmg);
			this.addGarbage(target);
		}

		this.advancePlayerWord(player);
	}

	private advancePlayerWord(player: SquabblePlayer) {
		player.wordIndex++;
		player.guesses = [];
		player.keyStates = {};
		player.garbageMask = new Array(6).fill(false);
		if (player.wordIndex >= this.words.length) {
			let newWord;
			do {
				newWord = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
			} while (this.words.includes(newWord));
			this.words.push(newWord);
		}
	}

	private healPlayer(player: SquabblePlayer, amount: number) {
		player.hp = Math.min(100, player.hp + amount);
	}

	private applyDamage(player: SquabblePlayer, amount: number) {
		player.hp = Math.max(0, player.hp - amount);
		player.damageTaken += amount;
		if (player.hp <= 0 && !player.eliminated) {
			this.eliminatePlayer(player);
		}
	}

	private addGarbage(player: SquabblePlayer) {
		if (player.guesses.length >= 6) return;

		let word;
		do {
			word = ANSWERS[Math.floor(Math.random() * ANSWERS.length)];
		} while (this.words.includes(word));
		const answer = this.words[player.wordIndex % this.words.length];
		const result = evaluateGuess(word, answer);

		player.guesses.push(word);
		player.garbageMask[player.guesses.length - 1] = true;

		word.split('').forEach((ch, i) => {
			const cur = player.keyStates[ch];
			const rank: Record<string, number> = { absent: 0, present: 1, correct: 2 };
			if (!cur || rank[result[i]] > rank[cur]) player.keyStates[ch] = result[i];
		});
	}

	private eliminatePlayer(player: SquabblePlayer) {
		player.eliminated = true;
		player.eliminatedAt = Date.now();
		const alive = this.players.filter((p) => !p.eliminated);
		player.placement = alive.length + 1;
		this.aliveCount = alive.length;
		this.stopDamageTick(player.id);

		if (this.aliveCount <= 1) {
			this.endGame();
		}
	}

	private checkElimination(playerId: string) {
		const player = this.players.find((p) => p.id === playerId);
		if (!player || !player.eliminated) return;

		const alive = this.players.filter((p) => !p.eliminated);
		this.aliveCount = alive.length;

		if (this.aliveCount <= 1) {
			this.endGame();
		}
	}

	private endGame() {
		this.phase = 'finished';
		this.gameEndedAt = Date.now();

		for (const [id] of this.damageTimers) {
			this.stopDamageTick(id);
		}

		const alive = this.players.filter((p) => !p.eliminated);
		if (alive.length === 1) {
			const winner = alive[0];
			winner.placement = 1;
			this.winnerId = winner.id;
		}

		const placed = this.players.filter((p) => p.placement !== null).length;
		const unplaced = this.players.filter((p) => p.placement === null).sort((a, b) => b.hp - a.hp);

		unplaced.forEach((p, i) => {
			p.placement = placed + i + 1;
		});
	}

	/* ---------- Damage tick ---------- */

	private startDamageTick(playerId: string) {
		this.stopDamageTick(playerId);
		const interval = this.settings.dmgTick * 1000;

		const timer = setInterval(
			() => {
				const player = this.players.find((p) => p.id === playerId);
				if (!player || player.eliminated || this.phase !== 'playing') return;

				this.applyDamage(player, 1);

				if (player.eliminated) {
					this.broadcastState();
				}
			},
			Math.max(1000, interval)
		);

		this.damageTimers.set(playerId, timer);
	}

	private stopDamageTick(playerId: string) {
		const timer = this.damageTimers.get(playerId);
		if (timer) {
			clearInterval(timer);
			this.damageTimers.delete(playerId);
		}
	}

	/* ---------- Helpers ---------- */

	private isHost(id: string) {
		const player = this.players.find((p) => p.id === id);
		return player?.isHost ?? false;
	}

	private randomAliveOpponent(excludeId: string): SquabblePlayer | null {
		const alive = this.players.filter(
			(p) => p.id !== excludeId && !p.eliminated && p.guesses.length < 5
		);
		if (alive.length === 0) return null;
		return alive[Math.floor(Math.random() * alive.length)];
	}

	/* ---------- Broadcasting ---------- */

	private broadcastTimer: ReturnType<typeof setTimeout> | null = null;
	private static readonly BROADCAST_INTERVAL_MS = 80;

	private broadcastState() {
		if (this.broadcastTimer) return;
		this.broadcastTimer = setTimeout(() => {
			this.broadcastTimer = null;
			this.flushState();
		}, GameRoom.BROADCAST_INTERVAL_MS);
	}

	private flushState() {
		const payload = JSON.stringify({
			type: 'state',
			state: this.selfState
		} satisfies ServerMessage);

		for (const ws of this.connections.values()) {
			if (ws.readyState !== WebSocket.OPEN) continue;
			if (ws.bufferedAmount > 10_000) continue;
			ws.send(payload);
		}
	}
}
