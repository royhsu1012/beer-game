const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { createRoom, getRoom, addPlayer, removePlayer, selectRole, startGame, submitOrder, findPlayerRoom } = require('./RoomManager')
const { processWeek, calculateResults } = require('./GameEngine')
const { ROUND_TIME_SECONDS, ROLES } = require('./gameConfig')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.use(express.json())
app.get('/health', (req, res) => res.json({ ok: true }))

// Keep Render free instance alive
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`).catch(() => {})
  }, 14 * 60 * 1000)
}

function broadcastRoom(roomCode) {
  const room = getRoom(roomCode)
  if (!room) return
  io.to(roomCode).emit('room_updated', {
    players: room.players.map(p => ({ name: p.name, role: p.role })),
    status: room.status
  })
}

function getLastOrder(room, role) {
  const history = room.gameState.roles[role].weeklyHistory
  return history.length > 0 ? history[history.length - 1].ord : 4
}

function resolveWeek(roomCode) {
  const room = getRoom(roomCode)
  if (!room || room.status !== 'playing') return

  // Auto-fill missing orders with last week's order
  const playerRoles = room.players.map(p => p.role)
  for (const role of playerRoles) {
    if (room.gameState.pendingOrders[role] === undefined) {
      room.gameState.pendingOrders[role] = getLastOrder(room, role)
    }
  }
  // Fill unplayed roles with 4
  for (const role of ROLES) {
    if (room.gameState.pendingOrders[role] === undefined) {
      room.gameState.pendingOrders[role] = 4
    }
  }

  const { newState, weekSnapshot, consumerDemand } = processWeek(room.gameState, room.gameState.pendingOrders)
  room.gameState = newState

  // Send each player only their own data
  room.players.forEach(player => {
    io.to(player.socketId).emit('week_results', {
      week: weekSnapshot[player.role].wk,
      mine: weekSnapshot[player.role],
      consumerDemand
    })
  })

  if (newState.status === 'finished') {
    const results = calculateResults(newState)
    const fullHistory = {}
    for (const role of ROLES) fullHistory[role] = newState.roles[role].weeklyHistory
    io.to(roomCode).emit('game_finished', { results, fullHistory })
    room.status = 'finished'
    return
  }

  // Start next week
  room.players.forEach(player => {
    const roleState = newState.roles[player.role]
    io.to(player.socketId).emit('week_started', {
      week: newState.week,
      timeLimit: ROUND_TIME_SECONDS,
      inventory: roleState.inventory,
      backlog: roleState.backlog,
      pipeline0: roleState.pipeline[0],
      pipeline1: roleState.pipeline[1]
    })
  })

  startRoundTimer(roomCode)
}

function startRoundTimer(roomCode) {
  const room = getRoom(roomCode)
  if (!room) return
  if (room.timerHandle) clearTimeout(room.timerHandle)
  room.timerHandle = setTimeout(() => resolveWeek(roomCode), ROUND_TIME_SECONDS * 1000)
}

io.on('connection', (socket) => {

  socket.on('create_room', ({ name }, cb) => {
    const room = createRoom(socket.id, name)
    const result = addPlayer(room.code, socket.id, name)
    if (result.error) return cb({ error: result.error })
    socket.join(room.code)
    cb({ roomCode: room.code })
    broadcastRoom(room.code)
  })

  socket.on('join_room', ({ roomCode, name }, cb) => {
    const code = roomCode.toUpperCase()
    const result = addPlayer(code, socket.id, name)
    if (result.error) return cb({ error: result.error })
    socket.join(code)
    cb({ ok: true })
    broadcastRoom(code)
  })

  socket.on('select_role', ({ roomCode, role }, cb) => {
    const result = selectRole(roomCode.toUpperCase(), socket.id, role)
    if (result.error) return cb({ error: result.error })
    cb({ ok: true })
    broadcastRoom(roomCode.toUpperCase())
  })

  socket.on('start_game', ({ roomCode }, cb) => {
    const code = roomCode.toUpperCase()
    const result = startGame(code)
    if (result.error) return cb({ error: result.error })
    const room = result.room
    room.players.forEach(player => {
      const roleState = room.gameState.roles[player.role]
      io.to(player.socketId).emit('game_started', {
        role: player.role,
        week: 1,
        timeLimit: ROUND_TIME_SECONDS,
        inventory: roleState.inventory,
        backlog: roleState.backlog,
        pipeline0: roleState.pipeline[0],
        pipeline1: roleState.pipeline[1]
      })
    })
    startRoundTimer(code)
    cb({ ok: true })
  })

  socket.on('submit_order', ({ quantity }, cb) => {
    const found = findPlayerRoom(socket.id)
    if (!found) return cb({ error: 'PLAYER_NOT_FOUND' })
    const { room, code, player } = found
    const result = submitOrder(code, player.role, quantity)
    if (result.error) return cb({ error: result.error })
    io.to(code).emit('submission_progress', {
      submittedCount: result.submittedCount,
      totalPlayers: result.totalPlayers
    })
    cb({ ok: true })
    if (result.allSubmitted) {
      if (room.timerHandle) clearTimeout(room.timerHandle)
      resolveWeek(code)
    }
  })

  socket.on('disconnect', () => {
    const found = findPlayerRoom(socket.id)
    if (!found) return
    const { code, room } = found
    removePlayer(code, socket.id)
    if (room && room.status === 'waiting') broadcastRoom(code)
    if (room && room.status === 'playing') {
      io.to(code).emit('player_disconnected', { message: '有玩家断线，等待重连...' })
    }
  })
})

const PORT = process.env.PORT || 8080
server.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`))
