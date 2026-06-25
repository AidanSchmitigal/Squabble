export function getPlayerId(code: string): string | null {
	return localStorage.getItem(`squabble-player-${code}`);
}

export function setPlayerId(code: string, id: string): void {
	localStorage.setItem(`squabble-player-${code}`, id);
}

export function getSound(): boolean {
	return localStorage.getItem('squabble-sound') !== 'false';
}

export function setSound(on: boolean): void {
	localStorage.setItem('squabble-sound', on ? 'true' : 'false');
}

export function getColorblind(): boolean {
	const val = localStorage.getItem('squabble-cb');
	return val !== 'false' && val !== null;
}

export function setColorblind(on: boolean): void {
	localStorage.setItem('squabble-cb', on ? 'true' : 'false');
}

export function getAvatar(): string | null {
	return localStorage.getItem('squabble-avatar');
}

export function setAvatar(avatar: string): void {
	localStorage.setItem('squabble-avatar', avatar);
}

export function getName(): string | null {
	return localStorage.getItem('squabble-name');
}

export function setName(name: string): void {
	localStorage.setItem('squabble-name', name);
}
