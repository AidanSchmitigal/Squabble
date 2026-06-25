import { WebSocket } from 'ws';
import type { GameState, ServerMessage } from '../src/lib/game';

export const BROADCAST_INTERVAL_MS = 80;

export function createBroadcaster(connections: Map<string, WebSocket>) {
	let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

	function flushState(getState: () => GameState) {
		const payload = JSON.stringify({
			type: 'state',
			state: getState()
		} satisfies ServerMessage);

		for (const ws of connections.values()) {
			if (ws.readyState !== WebSocket.OPEN) continue;
			if (ws.bufferedAmount > 10_000) continue;
			ws.send(payload);
		}
	}

	function broadcastState(getState: () => GameState) {
		if (broadcastTimer) return;
		broadcastTimer = setTimeout(() => {
			broadcastTimer = null;
			flushState(getState);
		}, BROADCAST_INTERVAL_MS);
	}

	return { broadcastState, flushState };
}

export function sendTo(connections: Map<string, WebSocket>, id: string, message: ServerMessage) {
	const ws = connections.get(id);
	if (ws?.readyState === WebSocket.OPEN) {
		ws.send(JSON.stringify(message));
	}
}
