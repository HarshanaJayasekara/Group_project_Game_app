<script lang="ts">
	import Phaser from 'phaser'
	import { onDestroy, onMount } from 'svelte'
	import { io } from 'socket.io-client'
	import { env } from '$env/dynamic/public'
	import { stateStore, State } from '$lib/store'
	import { goto } from '$app/navigation'

	let searchParams
	let room
	let rooms

	let currentPlayer = 1
	let playerIndex
	let playerList = {}
	let gameEnded = false

	$: if (currentPlayer) {
		// Code to execute on every change of the var
		console.info('currentPlayer UPDATE: ', currentPlayer)
	}
	$: if (playerIndex) {
		// Code to execute on every change of the var
		console.info('playerIndex UPDATE: ', playerIndex)
	}

	const url = 'https://snakes-and-ladders.codinghermit.net'

	const socket = io(url)

	let incoming = false
	let incomingRoll = false
	// let multiplayer = false
	let networkRoll
	let textInputsOpen = false

	let msgData = {
		room: '',
		player: '',
		message: '',
	}
	let incomingData = {
		currentPlayer: '',
		nextPlayer: '',
		message: '',
		roll: null,
	}

	function asyncEmit(eventName, data) {
		return new Promise(function (resolve, reject) {
			socket.emit(eventName, data)
			socket.on(eventName, (result) => {
				socket.off(eventName)
				resolve(result)
			})
			setTimeout(reject, 1000)
		})
	}

	const socketFunctions = {
		// joinRoom: () => socket.emit('joinRoom', msgData.room),
		// leaveRoom: () => socket.emit('leaveRoom', msgData.room),
		// disconnectRooms: () => socket.emit('disconnectRooms'),
		message: () => {
			msgData.player = socket.id || ''
			msgData.room = room
			socket.emit('message', msgData)
		},
		roll: () => socket.emit('roll', msgData),
	}

	socket.on('leaveAllRooms', () => {
		socket.rooms.forEach((room) => {
			socket.leave(room)
		})
	})

	socket.on('message', (data) => {
		console.info('message data: ', data)
		incomingData.currentPlayer = data.player
		incomingData.message = data.message
		incoming = true
		setTimeout(() => {
			incoming = false
		}, 6000)
	})

	// let rolled = true

	// let currentDirection = 'right'
	let extraUnits
	const tileSize = 32

	class MainScene extends Phaser.Scene {
		preload() {
			this.load.image('tiles', 'assets/tilemaps/tiles/tileset.png')
			this.load.image('car', 'assets/sprites/car90.png')
			this.load.tilemapCSV('map', 'assets/tilemaps/csv/grid.csv')
			this.load.spritesheet('spritesheet', 'assets/tilemaps/tiles/tileset.png', {
				frameWidth: tileSize,
				frameHeight: tileSize,
				margin: 1,
				spacing: 2,
				startFrame: 1,
				endFrame: 8,
			})

			this.load.image('button', 'assets/star.png')
		}

		create() {
			// Event handling for Svelte UI
			const eventEmitter = new Phaser.Events.EventEmitter()
			eventEmitter.on('roll-event', async () => {
				// if (rolled === true) return
				//
				// if (multiplayer) {
				// 	rolled = true
				// 	socket.emit('roll', msgData)
				// 	return
				// }
				if (room) {
					msgData.room = room
					// TODO MP rolls
					networkRoll = await asyncEmit('rollResult', msgData)
					console.log('🚀 ~ MainScene ~ eventEmitter.on ~ networkRoll:', networkRoll)
					// networkRoll = roll(networkRoll.roll)
					return
				}
				roll(false)
			})
			document.getElementById('event-button')!.addEventListener('click', () => eventEmitter.emit('roll-event'))

			const map = this.make.tilemap({ key: 'map', tileWidth: tileSize, tileHeight: tileSize })
			const tileset = map.addTilesetImage('tiles', 'tiles', tileSize, tileSize, 1, 2)
			const layer = map.createLayer(0, tileset?.name ?? 'tiles', 0, 0)

			const player1 = this.add.image(tileSize * 1 + 16, tileSize * 10 + 16, 'car')

			const player2 = this.add.image(tileSize * 1 + 16, tileSize * 10 + 16, 'car') // Different starting position
			player2.setTint(0xffff11) // Tint red for distinction

			// const player3 = this.add.image(tileSize * 1 + 16, tileSize * 10 + 16, 'car')
			// player3.setTint(0xff11ff)

			// const player4 = this.add.image(tileSize * 1 + 16, tileSize * 10 + 16, 'car') // Different starting position
			// player4.setTint(0x00ff00) // Tint red for distinction

			playerList = {
				1: {
					entity: player1,
					name: 'Player 1',
					currentDirection: 'right',
				},
				2: {
					entity: player2,
					name: 'Player 2',
					currentDirection: 'right',
				},
				// 3: {
				// 	entity: player3,
				// 	name: 'Player 3',
				// 	currentDirection: 'right',
				// },
				// 4: {
				// 	entity: player4,
				// 	name: 'Player 4',
				// 	currentDirection: 'right',
				// },
			}

			const validTiles = [0, 1, 3, 4, 5, 6, 7, 8]

			const commonComplete = () => {
				currentPlayer = (currentPlayer % 2) + 1
				stateStore.setState(State.READY)
			}

			const handleTile = {
				3: (player) => {
					this.tweens.add({
						targets: player,
						y: player.y + tileSize,
						x: player.x - tileSize,
						duration: 500,
						ease: 'Bounce',
					})
					playerList[currentPlayer].currentDirection = 'right'
				},
				5: (player) => {
					this.tweens.add({
						targets: player,
						y: player.y - tileSize,
						x: player.x + tileSize,
						duration: 500,
						ease: 'Bounce',
					})
					playerList[currentPlayer].currentDirection = 'left'
				},
				8: () => {
					console.warn('GAME ENDED')
					game.destroy(true, false)
					gameEnded = true
				},
			}

			const moveLeft = (player, distance = tileSize) => {
				let cells = distance / tileSize

				let tiles: any = []
				while (cells >= 1) {
					tiles[cells - 1] = layer?.getTileAtWorldXY(player.x - tileSize * cells, player.y, false)?.index
					tiles[cells - 1] =
						tiles[cells - 1] === undefined ||
						tiles[cells - 1] === null ||
						tiles[cells - 1] === -1 ||
						tiles[cells - 1] === 2
							? null
							: 1

					cells--
				}
				let totalUnits = tiles.length

				const invalidUnits = tiles.filter((element) => element === null).length

				const validUnits = totalUnits - invalidUnits

				if (validUnits === 0) {
					this.tweens.add({
						targets: player,
						y: player.y - tileSize,
						duration: 500,
						ease: 'Linear',
						onComplete: () => {
							playerList[currentPlayer].currentDirection = 'right'
							// Code to execute after the tween completes, if needed
							commonComplete()

							const tile: any = layer?.getTileAtWorldXY(player.x, player.y, false)?.index

							handleTile[tile]?.(player)
						},
					})
					player.angle = -90
					totalUnits--
					extraUnits = totalUnits
				} else {
					this.tweens.add({
						targets: player,
						x: player.x - tileSize * validUnits,
						duration: 500,
						ease: 'Linear',
						onComplete: () => {
							// Code to execute after the tween completes, if needed
							commonComplete()

							const tile: any = layer?.getTileAtWorldXY(player.x, player.y, false)?.index

							handleTile[tile]?.(player)
						},
					})
					player.angle = 180
					extraUnits = totalUnits - validUnits
				}
			}

			const moveRight = (player, distance = tileSize) => {
				let cells = distance / tileSize

				let tiles: any = []
				while (cells >= 1) {
					tiles[cells - 1] = layer?.getTileAtWorldXY(player.x + tileSize * cells, player.y, false)?.index

					tiles[cells - 1] =
						tiles[cells - 1] === undefined ||
						tiles[cells - 1] === null ||
						tiles[cells - 1] === -1 ||
						tiles[cells - 1] === 2
							? null
							: 1

					cells--
				}
				let totalUnits = tiles.length

				const invalidUnits = tiles.filter((element) => element === null).length

				const validUnits = totalUnits - invalidUnits

				if (validUnits === 0) {
					playerList[currentPlayer].currentDirection = 'left'
					this.tweens.add({
						targets: player,
						y: player.y - tileSize,
						duration: 500,
						ease: 'Linear',
						onComplete: () => {
							// Code to execute after the tween completes, if needed
							commonComplete()

							const tile: any = layer?.getTileAtWorldXY(player.x, player.y, false)?.index

							handleTile[tile]?.(player)
						},
					})
					player.angle = -90
					totalUnits--
					extraUnits = totalUnits
				} else {
					this.tweens.add({
						targets: player,
						x: player.x + tileSize * validUnits,
						duration: 500,
						ease: 'Linear',
						onComplete: () => {
							// Code to execute after the tween completes, if needed
							commonComplete()

							const tile: any = layer?.getTileAtWorldXY(player.x, player.y, false)?.index

							handleTile[tile]?.(player)
						},
					})
					player.angle = 0
					extraUnits = totalUnits - validUnits
				}
			}
			const moveUp = (player, distance = tileSize) => {
				const tile: any = layer?.getTileAtWorldXY(player.x, player.y - distance, true)
				if (tile === null) return
				if (!validTiles.includes(tile.index)) return
				player.y -= distance
				player.angle = -90
			}
			const moveDown = (player, distance = tileSize) => {
				const tile: any = layer?.getTileAtWorldXY(player.x, player.y + distance, true)
				if (tile === null) return
				if (!validTiles.includes(tile.index)) return
				player.y += distance
				player.angle = 90
			}

			const movementFunctions = {
				left: moveLeft,
				right: moveRight,
				up: moveUp,
				down: moveDown,
			}

			const rollDice = () => {
				return Math.floor(Math.random() * 6) + 1
			}

			const roll = (networkRoll) => {
				let distance
				if (networkRoll) {
					distance = tileSize * networkRoll
				} else {
					distance = tileSize * rollDice()
				}
				currentPlayer = playerIndex
				if (currentPlayer === undefined) {
					currentPlayer = 1
				}
				if (playerIndex === undefined) {
					playerIndex = 1
				}
				console.log('🚀 ~ MainScene ~ roll ~ playerIndex:', playerIndex)
				console.log('🚀 ~ MainScene ~ roll ~ currentPlayer:', currentPlayer)
				const direction = playerList[currentPlayer]?.currentDirection
				if (movementFunctions[direction]) {
					movementFunctions[direction](playerList[currentPlayer]?.entity, distance)
				} else {
				}
			}

			socket.on('rollResult', (data) => {
				incomingData.currentPlayer = data.currentPlayer
				incomingData.nextPlayer = data.nextPlayer
				incomingData.roll = data.roll
				networkRoll = data.roll
				incomingRoll = true
				setInterval(() => {
					incomingRoll = false
				}, 3000)
				roll(networkRoll)
			})
		}
	}

	const config = {
		type: Phaser.AUTO,
		width: tileSize * 12,
		height: tileSize * 12,
		parent: 'canvas-container',
		pixelArt: false,
		backgroundColor: '#1a1a2d',
		scene: MainScene,
		callbacks: {
			postBoot: function (game) {
				// In v3.15, you have to override Phaser's default styles
				game.canvas.style.width = '100%'
				game.canvas.style.height = '100%'
			},
		},
	}

	let game: any = new Phaser.Game(config)

	socket.on('roomList', (data) => {
		rooms = data
		console.log('Received room list:', rooms)
	})

	onDestroy(() => {
		if (game) {
			game.destroy(true) // Cleanly destroy the game
			game = null
		}
	})

	interface Room {
		name: string
		players: string[]
	}

	const findPlayerInRoom = (rooms: Room[], room: string, socketId: string | undefined): number => {
		const roomData = rooms.find((roomObj) => roomObj.name === room)

		if (roomData) {
			const playerIndex = roomData.players.findIndex((player) => player === socketId)
			return playerIndex
		}

		return -1 // Player or room not found
	}

	onMount(() => {
		searchParams = new URLSearchParams(window.location.search)
		room = searchParams.get('room')

		if (room) {
			// alert(`room: ${room}`)
			// TODO Placeholder

			setTimeout(() => {
				socket.emit('getList')
			}, 500)

			setTimeout(() => {
				stateStore.setState(State.READY)
				playerIndex = findPlayerInRoom(rooms, room, socket.id) + 1
				console.log('🚀 ~ setTimeout ~ socket.id:', socket.id)
				console.log('🚀 ~ setTimeout ~ room:', room)
				console.log('🚀 ~ setTimeout ~ rooms:', rooms)
				console.log('🚀 ~ setTimeout ~ playerIndex:', playerIndex)
			}, 1000)

			socket.emit('joinRoom', room)
			// multiplayer = true
		} else if (!room) {
			stateStore.setState(State.READY)
			// rolled = false
		}
	})
</script>

<div class="flex max-h-full max-w-full items-center justify-center">
	<div class:hidden={!incoming} class="display"><p>{incomingData.currentPlayer} said: {incomingData.message}</p></div>
	<div class:hidden={!incomingRoll} class="display">
		<p>{incomingData.currentPlayer} rolled: {incomingData.roll}, {incomingData.nextPlayer} goes next.</p>
	</div>
	<div class="overlay-top flex flex-col items-center justify-center">
		<div class="flex flex-row">
			<button
				on:click={() => {
					room = null
					stateStore.setState(State.IDLE)
					goto('/lobby')
				}}>Lobby</button
			>
			<button
				on:click={() => {
					textInputsOpen = !textInputsOpen
				}}>Text Input</button
			>
			<p>Room: {room ? room : 'OFFLINE'}</p>
		</div>
		<div class:hidden={!textInputsOpen} class="flex h-2 flex-col text-black">
			<input hidden={room} type="text" bind:value={msgData.room} placeholder="Room ID" />
			<input type="text" bind:value={msgData.message} placeholder="Message" />
		</div>
	</div>
	<div class:hidden={!gameEnded} class="overlay-mid flex flex-col items-center justify-center">
		<h1>Game Ended: {playerList[currentPlayer]?.name} Wins</h1>
	</div>
	<div class="overlay flex flex-col items-center justify-center">
		<div class="flex flex-row">
			{#if room}
				<button
					class:!bg-red-500={!($stateStore === State.READY)}
					disabled={!($stateStore === State.READY)}
					id="event-button"
					on:click={() => {
						stateStore.setState(State.ROLLING)
					}}
					>{($stateStore === State.IDLE || $stateStore === State.ROLLING) && currentPlayer !== playerIndex
						? 'Wait'
						: 'Roll'}</button
				>
			{:else}
				<button
					class:!bg-red-500={$stateStore === State.IDLE}
					disabled={$stateStore === State.IDLE || $stateStore === State.ROLLING}
					id="event-button"
					on:click={() => stateStore.setState(State.ROLLING)}>{$stateStore === State.IDLE ? 'Wait' : 'Roll'}</button
				>
			{/if}
			<button
				on:click={() => {
					socketFunctions.message()
				}}>Message</button
			>
		</div>
	</div>
	<div id="canvas-container"></div>
</div>

<style lang="postcss">
	.overlay {
		position: absolute; /* Position it relative to the parent */
		bottom: 30px;
		width: 50%;
		height: 5%;
		z-index: 100; /* Ensure it's on top of other elements */
		background-color: rgba(0, 0, 0, 0.5); /* Example semi-transparent background */
	}

	.overlay-top {
		position: absolute; /* Position it relative to the parent */
		top: 30px;
		width: 50%;
		height: 5%;
		z-index: 100; /* Ensure it's on top of other elements */
		background-color: rgba(0, 0, 0, 0.5); /* Example semi-transparent background */
	}

	.overlay-mid {
		position: absolute; /* Position it relative to the parent */
		top: 90px;
		width: 50%;
		height: 5%;
		z-index: 100; /* Ensure it's on top of other elements */
		background-color: rgba(0, 0, 0, 0.5); /* Example semi-transparent background */
	}

	.display {
		position: absolute; /* Position it relative to the parent */
		bottom: 360px;
		width: 50%;
		height: 5%;
		z-index: 100; /* Ensure it's on top of other elements */
		background-color: rgba(0, 0, 0, 0.5); /* Example semi-transparent background */
	}

	button {
		@apply border-4 bg-blue-500 px-2;
	}
	p {
		@apply border-4 bg-green-500 px-2;
	}
</style>
