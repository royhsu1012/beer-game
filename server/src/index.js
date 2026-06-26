const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const { createRoom, getRoom, addPlayer, removePlayer, reconnectPlayer, selectRole, deselectRole, addBot, removeBot, startGame, submitOrder, findPlayerRoom, resetRoom } = require('./RoomManager')
const { processWeek, calculateResults } = require('./GameEngine')
const { ROUND_TIME_SECONDS, ROLES } = require('./gameConfig')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
})

app.use(express.json())
app.use((req, res, next) => { res.header('Access-Control-Allow-Origin', '*'); next() })
app.get('/health', (req, res) => res.json({ ok: true }))

// Keep Render free instance alive
if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    fetch(`${process.env.RENDER_EXTERNAL_URL}/health`).catch(() => {})
  }, 14 * 60 * 1000)
}

function log(event, data = {}) {
  const ts = new Date().toISOString().slice(11, 19)
  const parts = Object.entries(data).map(([k, v]) => `${k}=${v}`).join(' ')
  console.log(`[${ts}] ${event}${parts ? ' ' + parts : ''}`)
}

function broadcastRoom(roomCode) {
  const room = getRoom(roomCode)
  if (!room) return
  io.to(roomCode).emit('room_updated', {
    players: room.players.map(p => ({ name: p.name, role: p.role, isBot: p.isBot || false })),
    status: room.status
  })
}

function calcBotOrder(roleState) {
  const history = roleState.weeklyHistory
  const recentDemands = history.slice(-3).map(h => h.dem)
  const avgDemand = recentDemands.length > 0
    ? recentDemands.reduce((a, b) => a + b, 0) / recentDemands.length
    : 4
  const inTransit = roleState.pipeline[0] + roleState.pipeline[1]
  const suggested = Math.round(avgDemand * 1.5) - roleState.inventory - inTransit + roleState.backlog
  const noise = Math.floor(Math.random() * 5) - 2
  return Math.max(0, suggested + noise)
}

function getLastOrder(room, role) {
  const history = room.gameState.roles[role].weeklyHistory
  return history.length > 0 ? history[history.length - 1].ord : 4
}

function resolveWeek(roomCode) {
  try {
  const room = getRoom(roomCode)
  if (!room || room.status !== 'playing') return

  for (const player of room.players.filter(p => p.isBot)) {
    if (room.gameState.pendingOrders[player.role] === undefined) {
      room.gameState.pendingOrders[player.role] = calcBotOrder(room.gameState.roles[player.role])
    }
  }

  const playerRoles = room.players.filter(p => !p.isBot).map(p => p.role)
  for (const role of playerRoles) {
    if (room.gameState.pendingOrders[role] === undefined) {
      room.gameState.pendingOrders[role] = getLastOrder(room, role)
    }
  }
  for (const role of ROLES) {
    if (room.gameState.pendingOrders[role] === undefined) {
      room.gameState.pendingOrders[role] = 4
    }
  }

  const { newState, weekSnapshot, consumerDemand } = processWeek(room.gameState, room.gameState.pendingOrders)
  room.gameState = newState
  log('week_resolved', { room: roomCode, week: weekSnapshot[ROLES[0]].wk })

  room.players.filter(p => !p.isBot).forEach(player => {
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
    log('game_finished', { room: roomCode })
    return
  }

  room.players.filter(p => !p.isBot).forEach(player => {
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
  } catch(e) {
    log('resolveWeek_error', { room: roomCode, error: e.message })
    io.to(roomCode).emit('server_error', { message: 'resolveWeek: ' + e.message })
  }
}

function startRoundTimer(roomCode) {
  const room = getRoom(roomCode)
  if (!room) return
  if (room.timerHandle) clearTimeout(room.timerHandle)
  room.timerHandle = setTimeout(() => resolveWeek(roomCode), ROUND_TIME_SECONDS * 1000)
}

function cleanupRoom(roomCode) {
  const room = getRoom(roomCode)
  if (!room) return
  if (room.timerHandle) clearTimeout(room.timerHandle)
  // RoomManager.removePlayer already deletes the room when empty
}

io.on('connection', (socket) => {
  log('connect', { id: socket.id })

  socket.on('create_room', ({ name }, cb) => {
    const room = createRoom(socket.id, name)
    const result = addPlayer(room.code, socket.id, name)
    if (result.error) return cb({ error: result.error })
    socket.join(room.code)
    log('create_room', { room: room.code, name })
    cb({ roomCode: room.code })
    broadcastRoom(room.code)
  })

  socket.on('join_room', ({ roomCode, name }, cb) => {
    const code = roomCode.toUpperCase()
    const result = addPlayer(code, socket.id, name)
    if (result.error) return cb({ error: result.error })
    socket.join(code)
    log('join_room', { room: code, name })
    cb({ ok: true })
    broadcastRoom(code)
  })

  socket.on('add_bot', ({ roomCode, role }, cb) => {
    const result = addBot(roomCode.toUpperCase(), role)
    if (result.error) return cb({ error: result.error })
    cb({ ok: true })
    broadcastRoom(roomCode.toUpperCase())
  })

  socket.on('remove_bot', ({ roomCode, role }, cb) => {
    const result = removeBot(roomCode.toUpperCase(), role)
    if (result.error) return cb({ error: result.error })
    cb({ ok: true })
    broadcastRoom(roomCode.toUpperCase())
  })

  socket.on('select_role', ({ roomCode, role }, cb) => {
    const result = selectRole(roomCode.toUpperCase(), socket.id, role)
    if (result.error) return cb({ error: result.error })
    cb({ ok: true })
    broadcastRoom(roomCode.toUpperCase())
  })

  socket.on('deselect_role', ({ roomCode }, cb) => {
    const result = deselectRole(roomCode.toUpperCase(), socket.id)
    if (result.error) return cb({ error: result.error })
    cb({ ok: true })
    broadcastRoom(roomCode.toUpperCase())
  })

  socket.on('start_game', ({ roomCode }, cb) => {
    const code = roomCode.toUpperCase()
    const result = startGame(code)
    if (result.error) return cb({ error: result.error })
    const room = result.room
    log('game_started', { room: code, players: room.players.length })
    room.players.filter(p => !p.isBot).forEach(player => {
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
    if (result.error) return cb({ error: result.error, maxOrder: result.maxOrder })
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

  socket.on('reconnect_game', ({ roomCode, name, role }, cb) => {
    const code = roomCode.toUpperCase()
    const result = reconnectPlayer(code, name, role, socket.id)
    if (result.error) return cb({ error: result.error })

    const { room, player } = result
    if (player.reconnectTimer) { clearTimeout(player.reconnectTimer); player.reconnectTimer = null }
    socket.join(code)
    log('reconnect', { room: code, name, role })

    const roleState = room.gameState.roles[role]
    cb({ ok: true })
    socket.emit('game_resumed', {
      role,
      week: room.gameState.week,
      timeLimit: ROUND_TIME_SECONDS,
      inventory: roleState.inventory,
      backlog: roleState.backlog,
      pipeline0: roleState.pipeline[0],
      pipeline1: roleState.pipeline[1],
      history: room.gameState.roles[role].weeklyHistory
    })
    io.to(code).emit('player_reconnected', { name })
  })

  socket.on('return_to_room', (_, cb) => {
    const found = findPlayerRoom(socket.id)
    if (!found) return cb({ error: 'ROOM_NOT_FOUND' })
    const { code, room } = found
    if (room.creatorId !== socket.id) return cb({ error: 'NOT_HOST' })
    const result = resetRoom(code)
    if (result.error) return cb({ error: result.error })
    log('room_reset', { room: code })
    cb({ ok: true })
    broadcastRoom(code)
    io.to(code).emit('room_reset', { roomCode: code })
  })

  socket.on('disconnect', () => {
    log('disconnect', { id: socket.id })
    const found = findPlayerRoom(socket.id)
    if (!found) return
    const { code, room } = found
    // Notify others if host disconnects from a finished game
    if (room && room.status === 'finished' && room.creatorId === socket.id) {
      io.to(code).emit('host_left')
    }
    const result = removePlayer(code, socket.id)
    if (room && room.status === 'waiting') {
      if (getRoom(code)) broadcastRoom(code)
      else cleanupRoom(code)
      return
    }
    if (room && room.status === 'playing' && result?.disconnected) {
      const player = result.disconnected
      io.to(code).emit('player_disconnected', { name: player.name, role: player.role })
      player.reconnectTimer = setTimeout(() => {
        if (player.disconnected) {
          player.isBot = true
          player.disconnected = false
          player.name = '電腦'
          log('bot_takeover', { room: code, role: player.role })
          io.to(code).emit('player_reconnected', { name: player.name, timedOut: true })
        }
      }, 60 * 1000)
    }
  })
})

const PORT = process.env.PORT || 8080
server.listen(PORT, () => log('server_start', { port: PORT }))
