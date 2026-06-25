const { initGameState } = require('./GameEngine')
const { ROLES } = require('./gameConfig')

const rooms = new Map()

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return rooms.has(code) ? generateRoomCode() : code
}

function createRoom(socketId, name) {
  const code = generateRoomCode()
  rooms.set(code, { code, status: 'waiting', players: [], gameState: null, timerHandle: null })
  return rooms.get(code)
}

function getRoom(code) { return rooms.get(code) || null }

function addPlayer(code, socketId, name) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  if (room.status !== 'waiting') return { error: 'GAME_ALREADY_STARTED' }
  if (room.players.length >= 4) return { error: 'ROOM_FULL' }
  room.players.push({ socketId, name, role: null })
  return { ok: true, room }
}

function removePlayer(code, socketId) {
  const room = getRoom(code)
  if (!room) return
  // During a game: mark disconnected instead of removing
  if (room.status === 'playing') {
    const player = room.players.find(p => p.socketId === socketId && !p.isBot)
    if (player) {
      player.disconnected = true
      player.socketId = null
      return { disconnected: player }
    }
  }
  room.players = room.players.filter(p => p.socketId !== socketId)
  if (room.players.length === 0) rooms.delete(code)
  return { removed: true }
}

function reconnectPlayer(code, name, role, newSocketId) {
  const room = getRoom(code)
  if (!room || room.status !== 'playing') return { error: 'GAME_NOT_ACTIVE' }
  const player = room.players.find(p => p.name === name && p.role === role && p.disconnected)
  if (!player) return { error: 'PLAYER_NOT_FOUND' }
  player.socketId = newSocketId
  player.disconnected = false
  return { ok: true, room, player }
}

function selectRole(code, socketId, role) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  if (!ROLES.includes(role)) return { error: 'INVALID_ROLE' }
  const taken = room.players.find(p => p.role === role && p.socketId !== socketId)
  if (taken) return { error: 'ROLE_TAKEN' }
  const player = room.players.find(p => p.socketId === socketId)
  if (!player) return { error: 'PLAYER_NOT_FOUND' }
  player.role = role
  return { ok: true, room }
}

function addBot(code, role) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  if (room.status !== 'waiting') return { error: 'GAME_ALREADY_STARTED' }
  if (!ROLES.includes(role)) return { error: 'INVALID_ROLE' }
  if (room.players.find(p => p.role === role)) return { error: 'ROLE_TAKEN' }
  if (room.players.length >= 4) return { error: 'ROOM_FULL' }
  room.players.push({ socketId: null, name: '電腦', role, isBot: true })
  return { ok: true, room }
}

function removeBot(code, role) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  if (room.status !== 'waiting') return { error: 'GAME_ALREADY_STARTED' }
  const idx = room.players.findIndex(p => p.role === role && p.isBot)
  if (idx === -1) return { error: 'BOT_NOT_FOUND' }
  room.players.splice(idx, 1)
  return { ok: true, room }
}

function startGame(code) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
  const humans = room.players.filter(p => !p.isBot)
  if (humans.length < 1) return { error: 'NOT_ENOUGH_PLAYERS' }
  if (room.players.length < 2) return { error: 'NOT_ENOUGH_PLAYERS' }
  const assigned = room.players.filter(p => p.role !== null)
  if (assigned.length !== room.players.length) return { error: 'NOT_ALL_ROLES_ASSIGNED' }
  room.status = 'playing'
  room.gameState = initGameState()
  return { ok: true, room }
}

function submitOrder(code, role, quantity) {
  const room = getRoom(code)
  if (!room || room.status !== 'playing') return { error: 'GAME_NOT_ACTIVE' }
  if (room.gameState.pendingOrders[role] !== undefined) return { error: 'ALREADY_SUBMITTED' }
  if (!Number.isInteger(quantity) || quantity < 0) return { error: 'INVALID_QUANTITY' }
  room.gameState.pendingOrders[role] = quantity
  const humanRoles = room.players.filter(p => !p.isBot).map(p => p.role)
  const submittedCount = humanRoles.filter(r => room.gameState.pendingOrders[r] !== undefined).length
  const allSubmitted = humanRoles.every(r => room.gameState.pendingOrders[r] !== undefined)
  return { ok: true, submittedCount, allSubmitted, totalPlayers: humanRoles.length }
}

function findPlayerRoom(socketId) {
  for (const [code, room] of rooms) {
    const player = room.players.find(p => p.socketId === socketId)
    if (player) return { room, code, player }
  }
  return null
}

module.exports = { createRoom, getRoom, addPlayer, removePlayer, reconnectPlayer, selectRole, addBot, removeBot, startGame, submitOrder, findPlayerRoom }
