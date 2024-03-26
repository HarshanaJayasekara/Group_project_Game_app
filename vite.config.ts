import { sveltekit } from '@sveltejs/kit/vite'
// import { SvelteKitPWA } from '@vite-pwa/sveltekit'
import { defineConfig } from 'vitest/config'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import AutoImport from 'unplugin-auto-import/vite'
import removeConsole from 'vite-plugin-svelte-console-remover'

export default defineConfig({
	server: {
		host: '0.0.0.0',
		port: '5173',
	},
	plugins: [
		sveltekit(),
		// SvelteKitPWA(),
		AutoImport({
			resolvers: [
				IconsResolver({
					prefix: 'Icon',
					extension: 'svelte',
				}),
			],
		}),
		Icons({
			compiler: 'svelte',
		}),
		removeConsole('log'),
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
	},
})
