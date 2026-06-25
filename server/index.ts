import { createServer } from 'http';
import { parse } from 'url';
import { WebSocket, WebSocketServer } from 'ws';
import { GameRoom } from './room';

const PORT = parseInt(process.env.PORT || '3000', 10);

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

	let room = rooms.get(roomCode);
	if (!room) {
		room = new GameRoom(roomCode);
		rooms.set(roomCode, room);
	}

	const id = room.addConnection(ws);

	ws.on('message', (data) => {
		room?.handleMessage(data.toString(), id);
	});

	ws.on('close', () => {
		if (room?.connections.get(id) !== ws) return;
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
