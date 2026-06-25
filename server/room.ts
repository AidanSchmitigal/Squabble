import { WebSocket } from 'ws';
import {
	DEFAULT_SETTINGS,
	EMPTY_AVATAR,
	evaluateGuess,
	nextRoomCode,
	sanitizeName,
	updateKeyStates,
	WORD_LEN,
	type Avatar,
	type GamePhase,
	type GameSettings,
	type GameState,
	type ServerMessage,
	type SquabblePlayer
} from '../src/lib/game';
import { VALID } from '../src/lib/assets/valid';
import { ANSWERS } from '../src/lib/assets/answers';
import { createBroadcaster, sendTo } from './broadcast';
import { createDamageManager } from './damage-tick';
import {
	advancePlayerWord,
	applyDamage,
	eliminatePlayer,
	endGame,
	healPlayer,
	isHost,
	randomAliveOpponent,
	addGarbage
} from './game-logic';

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
	private broadcaster = createBroadcaster(this.connections);
	private damageManager = createDamageManager();

	constructor(
		roomCode: string,
		private rooms: Map<string, GameRoom>
	) {
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
		this.broadcaster.broadcastState(() => this.selfState);
		return id;
	}

	removeConnection(id: string) {
		this.connections.delete(id);
		this.spectatorIds.delete(id);
		this.damageManager.stop(id);

		if (this.phase === 'lobby') {
			const idx = this.players.findIndex((p) => p.id === id);
			if (idx !== -1) {
				const wasHost = this.players[idx].isHost;
				this.players.splice(idx, 1);
				if (wasHost && this.players.length > 0) {
					this.players[0].isHost = true;
				}
			}
		} else {
			const player = this.players.find((p) => p.id === id);
			if (player) {
				player.connected = false;
			}

			if (this.phase === 'playing') {
				this.checkElimination(id);
			}
		}

		this.broadcaster.broadcastState(() => this.selfState);
	}

	handleMessage(message: string, senderId: string) {
		let parsed: import('../src/lib/game').ClientMessage;
		try {
			parsed = JSON.parse(message) as import('../src/lib/game').ClientMessage;
		} catch {
			return;
		}

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
				if (isHost(this.players, senderId)) {
					Object.assign(this.settings, parsed.settings);
				}
				break;
			case 'play-again':
				this.handlePlayAgain(senderId);
				return;
		}

		this.broadcaster.broadcastState(() => this.selfState);
	}

	/* ---------- Handlers ---------- */

	private handleJoin(senderId: string, name?: string, avatar?: Avatar, playerId?: string) {
		if (playerId) {
			const existing = this.players.find((p) => p.id === playerId);
			if (existing) {
				existing.id = senderId;
				existing.connected = true;
				if (name) existing.name = sanitizeName(name);
				if (avatar) existing.avatar = avatar;

				this.spectatorIds.delete(senderId);
				this.damageManager.stop(playerId);

				const ws = this.connections.get(senderId);
				if (ws) {
					ws.send(JSON.stringify({ type: 'hello', id: senderId } satisfies ServerMessage));
				}
				return;
			}

			if (this.phase !== 'lobby') {
				this.spectatorIds.add(senderId);
				return;
			}
		}

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
		const isHostFlag = this.players.length === 0;

		this.players.push({
			id: senderId,
			name: finalName,
			avatar: avatar ?? EMPTY_AVATAR,
			isHost: isHostFlag,
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
			garbageMask: new Array(6).fill(false),
			healedGreens: new Array(WORD_LEN).fill(false),
			healedYellows: []
		});
	}

	private handleSetPlayer(id: string, name?: string, avatar?: Avatar) {
		const player = this.players.find((p) => p.id === id);
		if (!player) return;
		if (name) player.name = sanitizeName(name);
		if (avatar) player.avatar = avatar;
		this.broadcaster.broadcastState(() => this.selfState);
	}

	private handleStartGame(senderId: string) {
		if (!isHost(this.players, senderId)) return;
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
			p.healedGreens = new Array(WORD_LEN).fill(false);
			p.healedYellows = [];
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
		updateKeyStates(player.keyStates, guess, result);

		const solved = result.every((r) => r === 'correct');

		if (solved) {
			player.wordsSolved++;
			healPlayer(player, 22);

			const target = randomAliveOpponent(this.players, player.id);
			if (target) {
				const dmg = 16 + Math.floor(Math.random() * 10);
				player.damageDealt += dmg;
				if (applyDamage(target, dmg)) {
					const count = eliminatePlayer(target, this.players);
					this.aliveCount = count;
					this.damageManager.stop(target.id);

					if (this.aliveCount <= 1) {
						this.endGame();
					}
				}
				addGarbage(target, this.words);
			}

			advancePlayerWord(player, this.words);
		} else {
			let healAmount = 0;
			for (let i = 0; i < result.length; i++) {
				if (result[i] === 'correct' && !player.healedGreens[i]) {
					player.healedGreens[i] = true;
					healAmount += 3;
				} else if (result[i] === 'present' && !player.healedYellows.includes(guess[i])) {
					player.healedYellows.push(guess[i]);
					healAmount += 1;
				}
			}
			healPlayer(player, healAmount);

			if (player.guesses.length >= 6) {
				advancePlayerWord(player, this.words);
			}
		}
	}

	private handlePlayAgain(senderId: string) {
		const next = nextRoomCode(this.roomCode);
		const existing = this.rooms.get(next);
		const busy = existing && existing.phase !== 'lobby';
		sendTo(this.connections, senderId, {
			type: 'suggest-room',
			roomCode: busy ? null : next
		});
	}

	/* ---------- Game flow ---------- */

	private startDamageTick(playerId: string) {
		const interval = this.settings.dmgTick * 1000;
		this.damageManager.start(playerId, interval, () => {
			const player = this.players.find((p) => p.id === playerId);
			if (!player || player.eliminated || this.phase !== 'playing') return;

			if (applyDamage(player, 1)) {
				const count = eliminatePlayer(player, this.players);
				this.aliveCount = count;
				this.damageManager.stop(player.id);

				if (this.aliveCount <= 1) {
					this.endGame();
				}
			}
			this.broadcaster.broadcastState(() => this.selfState);
		});
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
		this.damageManager.stopAll();

		const { winnerId } = endGame(this.players);
		this.winnerId = winnerId;
	}
}
