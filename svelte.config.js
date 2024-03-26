import adapter from '@sveltejs/adapter-static'
// import adapter from '@ptkdev/sveltekit-cordova-adapter'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess({})],

	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapter({
			// precompress: false,
			pages: 'build',
			assets: 'build',
			fallback: null,
			precompress: false,
			strict: true,
		}),
		// adapter: adapter({
		// 	strict: false,
		// 	platform: 'cordova',
		// }),
		// alias: {
		// 	// this will match a directory and its contents
		// 	// (`my-directory/x` resolves to `path/to/my-directory/x`)
		// 	$types: '.svelte-kit/types',
		// },
	},
}

export default config
