import { createServer } from 'http';
import { parse } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {
	ALLOWED_5,
	ANSWERS_5,
	DEFAULT_SETTINGS,
	EMPTY_AVATAR,
	evaluateGuess,
	sanitizeName,
	WORD_LEN,
	type Avatar,
	type ClientMessage,
	type GamePhase,
	type GameSettings,
	type GameState,
	type ServerMessage,
	type SquabblePlayer
} from '../src/lib/game';

const PORT = parseInt(process.env.PORT || '3000', 10);

function shuffleArray<T>(arr: T[]): T[] {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

class GameRoom {
	roomCode: string;
	phase: GamePhase = 'lobby';
	settings: GameSettings = { ...DEFAULT_SETTINGS };
	players: SquabblePlayer[] = [];
	words: string[] = [];
	aliveCount = 0;
	winnerId: string | null = null;

	private connections = new Map<string, WebSocket>();
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
			winnerId: this.winnerId
		};
	}

	addConnection(id: string, ws: WebSocket) {
		this.connections.set(id, ws);
		ws.send(JSON.stringify({ type: 'hello', id } satisfies ServerMessage));
		this.broadcastState();
	}

	removeConnection(id: string) {
		this.connections.delete(id);
		this.stopDamageTick(id);

		const existing = this.players.find((p) => p.id === id);
		if (existing) {
			existing.connected = false;
			this.players = this.players.filter((p) => p.id !== id);
		}

		if (this.phase === 'playing') {
			this.checkElimination(id);
		}

		this.broadcastState();
	}

	handleMessage(message: string, senderId: string) {
		let parsed: ClientMessage;
		try {
			parsed = JSON.parse(message) as ClientMessage;
		} catch {
			return;
		}

		switch (parsed.type) {
			case 'join':
				this.handleJoin(senderId, parsed.name, parsed.avatar);
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

	private handleJoin(id: string, name?: string, avatar?: Avatar) {
		const existing = this.players.find((p) => p.id === id);
		if (existing) {
			if (name) existing.name = sanitizeName(name);
			if (avatar) existing.avatar = avatar;
			existing.connected = true;
			return;
		}

		const finalName = sanitizeName(name || 'Player');
		const isHost = this.players.length === 0;

		this.players.push({
			id,
			name: finalName,
			avatar: avatar ?? EMPTY_AVATAR,
			isHost,
			connected: true,
			hp: 100,
			eliminated: false,
			placement: null,
			wordIndex: 0,
			wordsSolved: 0,
			guesses: [],
			keyStates: {},
			miniGrid: new Array(15).fill(false)
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
		this.words = shuffleArray(ANSWERS_5).slice(0, 20);
		this.aliveCount = this.players.length;
		this.winnerId = null;

		for (const p of this.players) {
			p.hp = 100;
			p.eliminated = false;
			p.placement = null;
			p.wordIndex = 0;
			p.wordsSolved = 0;
			p.guesses = [];
			p.keyStates = {};
			p.miniGrid = new Array(15).fill(false);
			this.startDamageTick(p.id);
		}
	}

	private handleSubmitGuess(senderId: string, guess: string) {
		if (this.phase !== 'playing') return;

		const player = this.players.find((p) => p.id === senderId);
		if (!player || player.eliminated) return;

		if (guess.length !== WORD_LEN) return;
		if (!ALLOWED_5.has(guess)) return;

		const answer = this.words[player.wordIndex % this.words.length];
		const result = evaluateGuess(guess, answer);

		player.guesses.push(guess);

		// Update key states
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

		// Deal damage + garbage to random alive opponent
		const target = this.randomAliveOpponent(player.id);
		if (target) {
			this.applyDamage(target, 16 + Math.floor(Math.random() * 10));
			this.addGarbage(target);
		}

		this.advancePlayerWord(player);
	}

	private advancePlayerWord(player: SquabblePlayer) {
		player.wordIndex++;
		player.guesses = [];
		player.keyStates = {};
		if (player.wordIndex >= this.words.length) {
			player.wordIndex = 0; // loop
		}
	}

	private healPlayer(player: SquabblePlayer, amount: number) {
		player.hp = Math.min(100, player.hp + amount);
	}

	private applyDamage(player: SquabblePlayer, amount: number) {
		player.hp = Math.max(0, player.hp - amount);
		if (player.hp <= 0 && !player.eliminated) {
			this.eliminatePlayer(player);
		}
	}

	private addGarbage(player: SquabblePlayer) {
		const empty = player.miniGrid.findIndex((cell) => !cell);
		if (empty !== -1) {
			player.miniGrid[empty] = true;
		} else {
			// Full grid: reset
			player.miniGrid = new Array(15).fill(false);
		}
	}

	private eliminatePlayer(player: SquabblePlayer) {
		player.eliminated = true;
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

		// Stop all damage timers
		for (const [id] of this.damageTimers) {
			this.stopDamageTick(id);
		}

		const alive = this.players.filter((p) => !p.eliminated);
		if (alive.length === 1) {
			const winner = alive[0];
			winner.placement = 1;
			this.winnerId = winner.id;
		}

		// Assign remaining placements to eliminated players
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

				// Only broadcast if state actually changed
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
		const alive = this.players.filter((p) => p.id !== excludeId && !p.eliminated);
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

const rooms = new Map<string, GameRoom>();

let svelteKitHandler:
	| ((req: import('http').IncomingMessage, res: import('http').ServerResponse, next?: void) => void)
	| null = null;

const server = createServer(async (req, res) => {
	if (svelteKitHandler) {
		svelteKitHandler(req, res);
	} else {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('Squabble WS Server\n');
	}
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
	const url = parse(req.url || '', true);
	const roomCode = ((url.query.room as string) || '')
		.toUpperCase()
		.replace(/[^A-Z]/g, '')
		.slice(0, 8);

	if (!roomCode) {
		ws.close(4000, 'Room code required');
		return;
	}

	const id = crypto.randomUUID();
	let room = rooms.get(roomCode);
	if (!room) {
		room = new GameRoom(roomCode);
		rooms.set(roomCode, room);
	}

	room.addConnection(id, ws);

	ws.on('message', (data) => {
		room?.handleMessage(data.toString(), id);
	});

	ws.on('close', () => {
		room?.removeConnection(id);
		if (room?.isEmpty) {
			rooms.delete(roomCode);
		}
	});
});

async function start() {
	try {
		const mod = await import('../build/handler.js');
		svelteKitHandler = mod.handler;
		console.log('SvelteKit handler loaded');
	} catch {
		console.log('No SvelteKit build found — WS server only');
	}

	server.listen(PORT, () => {
		console.log(`Squabble server listening on port ${PORT}`);
	});
}

start();
