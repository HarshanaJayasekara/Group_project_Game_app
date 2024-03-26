import { writable } from 'svelte/store'

export const State = {
	IDLE: 'idle',
	READY: 'ready',
	ROLLING: 'rolling',
}

const createStateStore = () => {
	const store = writable(State.IDLE) // Initialize with IDLE state

	const setState = (newState) => {
		if (Object.values(State).includes(newState)) {
			store.set(newState)
		} else {
			console.error('Invalid state:', newState)
		}
	}

	return { subscribe: store.subscribe, setState }
}

export const stateStore = createStateStore()
