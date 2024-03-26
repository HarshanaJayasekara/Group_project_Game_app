<script lang="ts">
	import '../app.pcss'
</script>

<div class="flex flex-col">
	<div class="w-full content-center items-center justify-center text-center">
		<slot />
	</div>
</div>

<style lang="postcss">
	:global(select) {
		color: black !important;
	}
</style>
