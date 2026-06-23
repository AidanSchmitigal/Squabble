import { createServer } from 'http';
import { parse } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import {
	challenges,
	POINTS_PER_RANK,
	ROUND_COUNT,
	sanitizeName,
	type Avatar,
	type ClientMessage,
	type GameState,
	type Player,
	type ServerMessage
} from '../src/lib/game';

const PORT = parseInt(process.env.PORT || '3000', 10);

class GameRoom {
	state: GameState;
	private connections = new Map<string, WebSocket>();

	constructor(roomCode: string) {
		this.state = {
			roomCode,
			phase: 'lobby',
			round: 0,
			presenterId: null,
			challenge: challenges[0],
			players: [],
			votes: [],
			updatedAt: Date.now(),
			phaseStartedAt: Date.now(),
			settings: { showGrid: false, randomRotations: false }
		};
	}

	addConnection(id: string, ws: WebSocket) {
		this.connections.set(id, ws);
		ws.send(JSON.stringify({ type: 'hello', id } satisfies ServerMessage));

		if (!this.state.presenterId) {
			this.state.presenterId = id;
		}

		this.broadcastState();
	}

	removeConnection(id: string) {
		this.connections.delete(id);

		if (id === this.state.presenterId) {
			this.state.presenterId = null;
		}

		const wasPlayer = this.state.players.some((p) => p.id === id);
		if (wasPlayer) {
			this.state.players = this.state.players.filter((p) => p.id !== id);
		}

		this.touch();
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
				this.upsertPlayer(senderId, parsed.name, parsed.avatar);
				break;
			case 'set-player':
				this.upsertPlayer(senderId, parsed.name, parsed.avatar);
				break;
			case 'phase':
				this.state.phase = parsed.phase;
				this.state.phaseStartedAt = Date.now();
				if (parsed.phase === 'study' || parsed.phase === 'draw') this.clearDoneFlags();
				if (parsed.phase === 'reveal') this.state.votes = [];
				if (parsed.phase === 'scores') this.advanceToScores();
				break;
			case 'next-round':
				this.state.round += 1;
				if (this.state.round >= ROUND_COUNT) {
					this.state.phase = 'finished';
					this.state.phaseStartedAt = Date.now();
				} else {
					this.state.phase = 'study';
					this.state.phaseStartedAt = Date.now();
					this.state.challenge = challenges[this.state.round % challenges.length];
					this.state.votes = [];
					this.state.players = this.state.players.map((player) => ({
						...player,
						drawing: undefined,
						done: false
					}));
				}
				break;
			case 'drawing':
				this.patchPlayer(senderId, { drawing: parsed.dataUrl, done: false });
				break;
			case 'clear-drawing':
				this.patchPlayer(senderId, { drawing: undefined, done: false });
				break;
			case 'done':
				this.patchPlayer(senderId, { done: parsed.done });
				break;
			case 'submit-vote':
				this.handleVote(senderId, parsed.rankings);
				break;
			case 'score':
				this.state.players = this.state.players.map((player) =>
					player.id === parsed.playerId
						? { ...player, score: Math.max(0, player.score + parsed.delta) }
						: player
				);
				break;
			case 'update-settings':
				this.state.settings = { ...this.state.settings, ...parsed.settings };
				break;
			case 'reset':
				this.state = this.makeInitialState();
				break;
		}

		this.touch();
		this.broadcastState();
	}

	get isEmpty() {
		return this.connections.size === 0;
	}

	private makeInitialState(): GameState {
		return {
			roomCode: this.state.roomCode,
			phase: 'lobby',
			round: 0,
			presenterId: null,
			challenge: challenges[0],
			players: [],
			votes: [],
			updatedAt: Date.now(),
			phaseStartedAt: Date.now(),
			settings: { showGrid: false, randomRotations: false }
		};
	}

	private upsertPlayer(id: string, name?: string, avatar?: Avatar) {
		const existing = this.state.players.find((player) => player.id === id);

		let desiredName: string;
		if (name !== undefined) {
			desiredName = sanitizeName(name);
		} else if (existing) {
			desiredName = existing.name;
		} else {
			desiredName = sanitizeName('');
		}

		const otherNames = new Set(this.state.players.filter((p) => p.id !== id).map((p) => p.name));
		let finalName = desiredName;
		if (otherNames.has(finalName)) {
			let counter = 2;
			while (otherNames.has(`${desiredName} ${counter}`)) {
				counter++;
			}
			finalName = `${desiredName} ${counter}`;
		}

		if (existing) {
			if (name !== undefined) existing.name = finalName;
			if (avatar !== undefined) existing.avatar = avatar;
			existing.connected = true;
			return;
		}
		this.state.players.push({
			id,
			name: finalName,
			avatar: avatar ?? { drawing: '' },
			score: 0,
			connected: true,
			joinedAt: Date.now()
		});
	}

	private patchPlayer(id: string, patch: Partial<Player>) {
		this.state.players = this.state.players.map((player) =>
			player.id === id ? { ...player, ...patch } : player
		);
	}

	private clearDoneFlags() {
		this.state.players = this.state.players.map((player) => ({ ...player, done: false }));
	}

	private handleVote(voterId: string, rankings: string[]) {
		const playerIds = this.state.players.map((p) => p.id);
		const maxRank = Math.min(3, playerIds.length - 1);

		if (rankings.length !== maxRank) return;
		if (new Set(rankings).size !== maxRank) return;
		if (rankings.includes(voterId)) return;
		if (!rankings.every((id) => playerIds.includes(id))) return;
		if (this.state.votes.some((v) => v.voterId === voterId)) return;

		this.state.votes = this.state.votes.filter((v) => v.voterId !== voterId);
		this.state.votes.push({ voterId, rankings });

		if (this.checkVotingComplete()) {
			this.advanceToScores();
		}
	}

	private checkVotingComplete(): boolean {
		const voterIds = this.state.players.map((p) => p.id);
		const votedIds = this.state.votes.map((v) => v.voterId);
		return voterIds.every((id) => votedIds.includes(id));
	}

	private advanceToScores() {
		const points: Record<string, number> = {};
		for (const player of this.state.players) {
			points[player.id] = 0;
		}

		for (const vote of this.state.votes) {
			for (let i = 0; i < vote.rankings.length; i++) {
				const pts = POINTS_PER_RANK[i] ?? 0;
				points[vote.rankings[i]] = (points[vote.rankings[i]] ?? 0) + pts;
			}
		}

		this.state.players = this.state.players.map((player) => ({
			...player,
			score: player.score + (points[player.id] ?? 0)
		}));
	}

	private touch() {
		this.state.updatedAt = Date.now();
	}

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
		const payload = JSON.stringify({ type: 'state', state: this.state } satisfies ServerMessage);
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
		res.end('Perspective Party WS Server\n');
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
		console.log(`Server listening on port ${PORT}`);
	});
}

start();
