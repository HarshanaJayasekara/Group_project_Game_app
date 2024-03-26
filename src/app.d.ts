// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import '@sveltejs/kit'
import 'unplugin-icons/types/svelte'
declare module 'socket.io-client' {
	interface Socket {
		rooms: Set<string>
		leave(room: string): void
	}
}

declare global {
	namespace App {
		interface Locals {
			user: import('lucia').User | null
			session: import('lucia').Session | null
			isAdmin?: boolean
			isMaintainer?: boolean
			isPlayer?: boolean
			username?: string
		}
	}
}

export {}
