const { ROLES, HOLDING_COST, SHORTAGE_COST, TOTAL_WEEKS, INITIAL_INVENTORY, INITIAL_PIPELINE, generateDemandCurve } = require('./gameConfig')

function initGameState() {
  // 每局游戏生成新的需求曲线
  const { curve, mode, base, peak, seed } = generateDemandCurve()

  const roles = {}
  for (const role of ROLES) {
    roles[role] = {
      inventory: INITIAL_INVENTORY,
      backlog: 0,
      pipeline: [...INITIAL_PIPELINE],
      cumulativeCost: 0,
      weeklyHistory: []
    }
  }

  return {
    week: 1,
    roles,
    pendingOrders: {},
    status: 'active',
    demandCurve: curve,       // 每局不同的需求曲线
    demandMode: mode,         // 季节模式（游戏结束复盘时揭露）
    demandBase: base,
    demandPeak: peak,
    demandSeed: seed
  }
}

function processWeek(state, orders) {
  const week = state.week
  const consumerDemand = state.demandCurve[week - 1]
  const newRoles = {}

  const received = {}
  for (const role of ROLES) received[role] = state.roles[role].pipeline[0]

  const inventoryAfterReceiving = {}
  for (const role of ROLES) inventoryAfterReceiving[role] = state.roles[role].inventory + received[role]

  const incomingDemand = {
    retailer:     consumerDemand,
    wholesaler:   orders.retailer,
    distributor:  orders.wholesaler,
    manufacturer: orders.distributor
  }

  const totalDemand = {}
  for (const role of ROLES) totalDemand[role] = incomingDemand[role] + state.roles[role].backlog

  const shipment = {}, newBacklog = {}, inventoryAfterShipping = {}
  for (const role of ROLES) {
    shipment[role] = Math.min(inventoryAfterReceiving[role], totalDemand[role])
    inventoryAfterShipping[role] = inventoryAfterReceiving[role] - shipment[role]
    newBacklog[role] = totalDemand[role] - shipment[role]
  }

  const costs = {}
  for (const role of ROLES) {
    const holdingCost = inventoryAfterShipping[role] * HOLDING_COST
    const shortageCost = newBacklog[role] * SHORTAGE_COST
    costs[role] = { holdingCost, shortageCost, weekCost: holdingCost + shortageCost }
  }

  const newPipeline = {}
  for (const role of ROLES) newPipeline[role] = [state.roles[role].pipeline[1], orders[role]]

  const weekSnapshot = {}
  for (const role of ROLES) {
    const newCumCost = state.roles[role].cumulativeCost + costs[role].weekCost
    weekSnapshot[role] = {
      week,
      received:       received[role],
      incomingDemand: incomingDemand[role],
      totalDemand:    totalDemand[role],
      shipment:       shipment[role],
      inventory:      inventoryAfterShipping[role],
      backlog:        newBacklog[role],
      orderPlaced:    orders[role],
      holdingCost:    costs[role].holdingCost,
      shortageCost:   costs[role].shortageCost,
      weekCost:       costs[role].weekCost,
      cumulativeCost: newCumCost
    }
    newRoles[role] = {
      inventory:      inventoryAfterShipping[role],
      backlog:        newBacklog[role],
      pipeline:       newPipeline[role],
      cumulativeCost: newCumCost,
      weeklyHistory:  [...state.roles[role].weeklyHistory, weekSnapshot[role]]
    }
  }

  const newState = {
    ...state,
    week: week + 1,
    roles: newRoles,
    pendingOrders: {},
    status: week >= TOTAL_WEEKS ? 'finished' : 'active'
  }

  return { newState, weekSnapshot, consumerDemand }
}

function calculateResults(finalState) {
  const results = {}
  let teamTotal = 0

  for (const role of ROLES) {
    const history = finalState.roles[role].weeklyHistory
    const totalCost = finalState.roles[role].cumulativeCost
    const shortageWeeks = history.filter(w => w.backlog > 0).length
    const orders = history.map(w => w.orderPlaced)
    const avg = orders.reduce((a, b) => a + b, 0) / orders.length
    const orderSD = Math.sqrt(orders.reduce((s, o) => s + Math.pow(o - avg, 2), 0) / orders.length)
    teamTotal += totalCost
    results[role] = { totalCost, shortageWeeks, orderSD, history }
  }

  const sorted = [...ROLES].sort((a, b) => results[a].totalCost - results[b].totalCost)
  sorted.forEach((role, i) => { results[role].rank = i + 1 })
  results.teamTotal = teamTotal
  results.teamWin = teamTotal < 700

  // 复盘时揭露需求模式
  results.demandInfo = {
    mode: finalState.demandMode,
    curve: finalState.demandCurve,
    base: finalState.demandBase,
    peak: finalState.demandPeak,
    modeLabel: {
      summer:  '☀️ 夏季旺季型（第6-14周高峰）',
      winter:  '❄️ 冬季旺季型（第12周后持续走高）',
      bimodal: '📈 双峰型（两次需求高峰）',
      shock:   '⚡ 突发冲击型（某周暴增后回落）'
    }[finalState.demandMode]
  }

  return results
}

module.exports = { initGameState, processWeek, calculateResults }
