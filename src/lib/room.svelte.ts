import { goto } from '$app/navigation';
import { getPlayerId, setPlayerId } from './storage';
import {
	evaluateGuess,
	updateKeyStates,
	WORD_LEN,
	type ClientMessage,
	type GameState,
	type ServerMessage
} from './game';
import { resolve } from '$app/paths';

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

	disconnect() {
		this.#manualClose = true;
		this.#socket?.close();
		this.#socket = null;
		this.connected = false;
		this._gameState = null;
		if (this.#reconnectTimer) {
			clearTimeout(this.#reconnectTimer);
			this.#reconnectTimer = null;
		}
	}

	#open() {
		this.connected = false;
		this.selfId = '';
		this._gameState = null;

		const ws = new WebSocket(this.#wsUrl());
		this.#socket = ws;
		ws.addEventListener('open', () => {
			this.connected = true;
			this.#reconnectAttempt = 0;

			const storedId = getPlayerId(this.#code);
			if (storedId) {
				ws.send(JSON.stringify({ type: 'join', playerId: storedId } satisfies ClientMessage));
			}
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
			if (message.type === 'hello') {
				this.selfId = message.id;
				setPlayerId(this.#code, message.id);
			}
			if (message.type === 'state') this._gameState = message.state;
			if (message.type === 'suggest-room') {
				if (message.roomCode) {
					goto(resolve(`/room/${message.roomCode}`));
				} else {
					goto(resolve('/'));
				}
			}
		});
	}

	#wsUrl() {
		const protocol = import.meta.env.DEV ? 'ws' : 'wss';
		return `${protocol}://${window.location.host}/ws?room=${this.#code}`;
	}

	send(message: ClientMessage) {
		if (this.#socket?.readyState === WebSocket.OPEN) {
			this.#socket.send(JSON.stringify(message));
		}
	}

	optimisticSubmitGuess(guess: string) {
		const gs = this._gameState;
		if (!gs) return;
		const me = gs.players.find((p) => p.id === this.selfId);
		if (!me || me.eliminated) return;
		if (guess.length !== WORD_LEN) return;

		const answer = gs.words[me.wordIndex % gs.words.length];
		const result = evaluateGuess(guess, answer);

		me.guesses = [...me.guesses, guess];
		updateKeyStates(me.keyStates, guess, result);
	}
}

export const roomState = new RoomState();
