<script>
	import io from 'socket.io-client'
	import { env } from '$env/dynamic/public'
	import { goto } from '$app/navigation'

	const url = 'https://snakes-and-ladders.codinghermit.net'

	const socket = io(url)

	let rooms

	const MAX_PLAYERS = 2

	let roomSlots = [
		{ name: 'ROOM1', players: [] },
		{ name: 'ROOM2', players: [] },
		{ name: 'ROOM3', players: [] },
		{ name: 'ROOM4', players: [] },
	]

	rooms = roomSlots
	// Store the list of rooms
	// let roomSlots = [
	// 	{ name: 'ROOM1', players: [] },
	// 	{ name: 'ROOM2', players: [] },
	// 	{ name: 'ROOM3', players: [] },
	// 	{ name: 'ROOM4', players: [] },
	// ]

	function getRoomList() {
		socket.emit('getList')
	}
	function clearRooms() {
		socket.emit('clearRooms')
		rooms = roomSlots
	}

	socket.on('roomList', (data) => {
		rooms = data
		console.log('Received room list:', rooms)
	})

	socket.on('leaveAllRooms', () => {
		socket.rooms.forEach((room) => {
			socket.leave(room)
		})
	})
</script>

<nav class="nav-wrapper flex max-w-full flex-col items-center justify-center md:flex-row">
	<a
		class="mb-2 rounded bg-red-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-red-700"
		href="/">Play</a
	>
</nav>

<div class="flex flex-col">
	<button
		class="mb-2 rounded bg-blue-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-blue-700"
		on:click={getRoomList}>Get List of Active Rooms</button
	>

	<button
		class="mb-2 rounded bg-blue-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-blue-700"
		on:click={clearRooms}>Reset Rooms</button
	>
</div>

<div class="flex flex-col items-center justify-center">
	<!-- {#each roomSlots as room}
		<button
			on:click={() => {
				if (room.players.length < 4) {
					goto(`./?room=${room.name}`)
				} else if (room.players.length >= 4) {
					alert('Room full!')
				}
			}}
			class=" m-2 w-[50%] rounded bg-red-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-red-700"
		>
			<h2>Room: {room.name}</h2>
		</button>
	{/each} -->
	{#each rooms as room}
		<button
			on:click={() => {
				if (room.players.length < MAX_PLAYERS) {
					goto(`./?room=${room.name}`)
				} else if (room.players.length >= MAX_PLAYERS) {
					alert('Room full!')
				}
			}}
			class=" m-2 w-[50%] rounded bg-red-500 px-4 py-2 font-bold text-white transition-colors duration-300 hover:bg-red-700"
		>
			{#if room.players.length >= MAX_PLAYERS}
				(ROOM FULL)
			{/if}
			<h2>Room: {room.name}</h2>
			<p>Players:</p>
			<ul>
				{#each room.players as playerId, index}
					<li>Player {index + 1}: <br /> {playerId}</li>
				{/each}
			</ul>
		</button>
	{/each}
</div>

<style>
	ul {
		overflow-wrap: break-word;
		word-wrap: break-word;
		white-space: normal !important;
	}
</style>
