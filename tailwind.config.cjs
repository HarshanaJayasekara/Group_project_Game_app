/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require('path')
const { skeleton } = require('@skeletonlabs/tw-plugin')
import forms from '@tailwindcss/forms'
// import scrollbar from 'tailwind-scrollbar'

/** @type {import('tailwindcss').Config}*/
const config = {
	// Opt for dark mode to be handled via the class method
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		// Append the path to the Skeleton package
		join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}'),
	],
	theme: {
		extend: {
			boxShadow: {
				right: '10px 0 8px -2px hsla(210, 50%, 20%, 0.2)',
			},
			colors: {
				'pure-black': '#00000000',
			},
		},
	},
	plugins: [
		// Append the Skeleton plugin (after other plugins)
		skeleton({
			themes: { preset: ['crimson'] },
		}),
		forms,
		// scrollbar,
	],
}

module.exports = config
