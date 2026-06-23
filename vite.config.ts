import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter()
		})
	],
	server: {
		watch: {
			ignored: [
				'.partykit/**',
				'.svelte-kit/**',
				'node_modules/**',
				'.vscode/**',
				'server/**',
				'**/*.ottotime'
			]
		},
		proxy: {
			'/ws': {
				target: 'ws://localhost:3000',
				ws: true,
				changeOrigin: true
			}
		}
	}
});
