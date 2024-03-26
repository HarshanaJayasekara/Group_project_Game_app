import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { fileURLToPath } from 'url'
import path from 'path' // Built-in Node.js module
// import { handler } from '../../build/handler'
// import cors from 'cors'

interface Room {
	name: string
	players: string[] // Array of player IDs (or whatever identifies your players)
	currentPlayer: number // Index
	nextPlayer: number // Index
}

// const mainOrigin = process.env.ORIGIN || 'https://snakes-and-ladders.codinghermit.net' // Default fallback
// const ORIGIN = [mainOrigin, 'http://localhost', 'capacitor://localhost']

const app = express()
// app.use(
// 	cors({
// 		origin: ORIGIN,
// 		methods: ['GET', 'POST'],
// 	})
// ) // Enable CORS for all routes
// app.use(cors())
app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*')
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
	next()
})
const server = http.createServer(app)
const io = new Server(server, {
	cors: {
		origin: '*',
		methods: ['*'],
	},
})

/*
 * SvelteKit
 */
// Always use app.use(handler) after express routes are defined for adapter-node, otherwise express routes wont work: https://stackoverflow.com/a/73440683/8953964
/*
 * Node Adapter
 */
// app.use(handler)
/*
 * Static Adapter
 */
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const buildPath = path.join(__dirname, '../../build') // Assumes the 'build' folder is relative to this file
app.use('/', express.static(buildPath)) // Serve static files under '/app'
// Catch-all route for SvelteKit's client-side routing
app.get('*', (req, res) => {
	res.sendFile(path.join(buildPath, 'index.html'))
})

const activeRooms = new Map<string, Room>()

io.on('connection', (socket) => {
	console.info('USER CONNECTED')
	socket.on('joinRoom', (room) => {
		console.info('joinRoom TRIGGERED')
		socket.join(room)
		if (!activeRooms.has(room)) {
			activeRooms.set(room, {
				name: room,
				players: [],
				currentPlayer: 0,
				nextPlayer: 1,
			})
		}
		if (!activeRooms.get(room)?.players.includes(socket.id)) {
			activeRooms.get(room)?.players.push(socket.id)
		}
		console.log('🚀 ~ socket.on ~ activeRooms.get(room):', activeRooms.get(room))
		console.info('Added player to room:', room)
	})

	socket.on('getList', () => {
		const rooms = Array.from(activeRooms.values()) // Convert the Map values into an array of rooms
		socket.emit('roomList', rooms)
	})

	console.log('🚀 ~ socket.on ~ activeRooms:', activeRooms)

	socket.on('leaveRoom', (room) => {
		console.info('leaveRoom TRIGGERED')
		socket.leave(room)
		if (activeRooms.has(room)) {
			// Check if the room exists
			delete activeRooms[room]
			console.info('Deleted room:', room)
		} else {
			console.warn('Attempt to delete a non-existent room:', room) // Log a warning
		}
	})

	socket.on('disconnectRooms', () => {
		console.info('disconnectRooms TRIGGERED')
		socket.rooms.forEach((room) => {
			if (activeRooms.has(room)) {
				// Check if the room exists
				delete activeRooms[room]
				console.info('Deleted room on disconnect:', room)
			} else {
				console.warn('Attempt to delete a non-existent room on disconnect:', room)
			}
		})
	})

	socket.on('clearRooms', () => {
		console.debug('Clearing all rooms!')

		// 1. Broadcast to all sockets to leave their rooms
		io.sockets.emit('leaveAllRooms') // Emit to all sockets

		// 2. Clear the activeRooms data structure
		activeRooms.clear()
		console.debug('All rooms cleared.')
	})

	socket.on('disconnect', () => {
		console.info('USER DISCONNECTED')

		// Find rooms the player was in, and remove them
		const rooms = Array.from(socket.rooms) // Excluding the socket's own room ID
		rooms.forEach((room) => {
			if (activeRooms.has(room)) {
				const roomData: any = activeRooms.get(room)

				// Remove the player from the players array
				roomData.players = roomData.players.filter((player) => player !== socket.id)

				// Room cleanup logic
				if (roomData.players.length === 0) {
					activeRooms.delete(room)
					console.info('Room deleted due to no players:', room)
				} else {
					// ... handle potential turn adjustments if needed ...
				}
			}
		})
	})

	// Provide an endpoint or emit an event to get the list of rooms when needed

	socket.on('message', (data) => {
		console.info('message TRIGGERED: ', data)
		io.to(data.room).emit('message', data)
		console.info('Message received:', data)
	})

	// Game stuff
	socket.on('rollResult', (data) => {
		console.info('roll TRIGGERED')

		const room = activeRooms.get(data.room)
		if (room) {
			// Ensure the room exists
			// Assuming your data object includes a room and player name
			const roll = rollDice()
			console.info('roll:', roll)

			if (socket.id === room.players[room.currentPlayer]) {
				io.to(data.room).emit('rollResult', {
					roll: roll,
					currentPlayer: room.players[room.currentPlayer],
					nextPlayer: room.players[room.nextPlayer],
				})

				// Increment and modulo for circular turn order
				room.currentPlayer = (room.currentPlayer + 1) % room.players.length
				room.nextPlayer = (room.currentPlayer + 1) % room.players.length

				console.info('Game data received:', JSON.stringify(data, null, 2))
			}
		}
	})

	socket.on('requestPlayerIndex', (clientRoom) => {
		if (clientRoom && activeRooms.has(clientRoom)) {
			const room = activeRooms.get(clientRoom)
			const playerIndex = room?.players.indexOf(socket.id)
			console.log('🚀 ~ socket.on ~ playerIndex:', playerIndex)
			socket.emit('playerIndex', playerIndex)
		}
	})
})

server.listen(4000, () => {
	console.info('Server listening on port 4000')
})

function rollDice() {
	return Math.floor(Math.random() * 6) + 1
}
