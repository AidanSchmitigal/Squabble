import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	const roomCode = params.code
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, '')
		.slice(0, 8);

	if (!roomCode) {
		redirect(302, '/');
	}

	return {
		roomCode
	};
}
