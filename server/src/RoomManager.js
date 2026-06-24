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
  room.players = room.players.filter(p => p.socketId !== socketId)
  if (room.players.length === 0) rooms.delete(code)
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

function startGame(code) {
  const room = getRoom(code)
  if (!room) return { error: 'ROOM_NOT_FOUND' }
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
  const submittedCount = Object.keys(room.gameState.pendingOrders).length
  const playerRoles = room.players.map(p => p.role)
  const allSubmitted = playerRoles.every(r => room.gameState.pendingOrders[r] !== undefined)
  return { ok: true, submittedCount, allSubmitted, totalPlayers: room.players.length }
}

function findPlayerRoom(socketId) {
  for (const [code, room] of rooms) {
    const player = room.players.find(p => p.socketId === socketId)
    if (player) return { room, code, player }
  }
  return null
}

module.exports = { createRoom, getRoom, addPlayer, removePlayer, selectRole, startGame, submitOrder, findPlayerRoom }
