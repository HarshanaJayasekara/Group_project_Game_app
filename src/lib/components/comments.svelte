<script lang="ts">
	import { env } from '$env/dynamic/public'

	console.log('ENV: ', env)

	const ISSO_LOCAL = env.PUBLIC_ISSO_LOCAL
	const isDevelopment = ISSO_LOCAL === 'http://localhost:8080/'
	const issoHost = isDevelopment ? 'http://localhost:8080/' : 'https://comments.codinghermit.net/'
	console.log('🚀 ~ issoHost:', issoHost)

	function loadScript(node, src) {
		if (!document.querySelector(`script[src="${src}"]`)) {
			const script = document.createElement('script')
			script.src = src
			script.async = true
			document.head.appendChild(script)

			return {
				destroy() {
					document.head.removeChild(script)
				},
			}
		}
	}
</script>

<section use:loadScript={issoHost + 'js/embed.min.js'} class="comments text-white" id="isso-thread">
	<noscript>Javascript needs to be activated to view comments.</noscript>
</section>

<style>
	.comments :global(input) {
		color: black; /* Style applied only to selected elements within the .container */
	}
	.comments :global(textarea) {
		color: black; /* Style applied only to selected elements within the .container */
	}
	.comments :global(select) {
		color: black; /* Style applied only to selected elements within the .container */
	}
</style>
