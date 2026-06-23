import { type ClientMessage, type GameState, type ServerMessage } from './game';

class RoomState {
	connected = $state(false);
	selfId = $state('');
	_gameState = $state<GameState | null>(null);

	#socket: WebSocket | null = null;
	#code = '';
	#reconnectAttempt = 0;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	#manualClose = false;

	get gameState(): GameState {
		console.assert(this._gameState && this.connected, 'Game state not available');
		return this._gameState!;
	}

	get ready() {
		return this.connected && this._gameState !== null;
	}

	connect(code: string) {
		this.#manualClose = true;
		this.#socket?.close();
		this.#manualClose = false;
		this.#code = code;
		this.#reconnectAttempt = 0;
		if (this.#reconnectTimer) clearTimeout(this.#reconnectTimer);
		this.#open();
	}

	#open() {
		this.connected = false;
		this.selfId = '';
		this._gameState = null;

		const ws = new WebSocket(getWsUrl(this.#code));
		this.#socket = ws;
		ws.addEventListener('open', () => {
			this.connected = true;
			this.#reconnectAttempt = 0;
		});
		ws.addEventListener('close', () => {
			this.connected = false;
			if (this.#manualClose) return;
			const delay = Math.min(500 * 2 ** this.#reconnectAttempt, 5000);
			this.#reconnectAttempt += 1;
			this.#reconnectTimer = setTimeout(() => this.#open(), delay);
		});
		ws.addEventListener('message', (event) => {
			const message = JSON.parse(event.data as string) as ServerMessage;
			if (message.type === 'hello') this.selfId = message.id;
			if (message.type === 'state') this._gameState = message.state;
		});
	}

	send(message: ClientMessage) {
		if (this.#socket?.readyState === WebSocket.OPEN) {
			this.#socket.send(JSON.stringify(message));
		}
	}
}

function getWsUrl(code: string) {
	const protocol = import.meta.env.DEV ? 'ws' : 'wss';
	return `${protocol}://${window.location.host}/ws?room=${code}`;
}

export const roomState = new RoomState();
