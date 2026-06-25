const { ROLES, ROLE_COSTS, TOTAL_WEEKS, INITIAL_INVENTORY, INITIAL_PIPELINE, generateDemandCurve } = require('./gameConfig')

function initGameState() {
  // 每局游戏生成新的需求曲线
  const { curve, mode, modeDesc, base, peak, seed } = generateDemandCurve()

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
    demandCurve:    curve,
    demandMode:     mode,
    demandModeDesc: modeDesc,
    demandBase:     base,
    demandPeak:     peak,
    demandSeed:     seed
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
    const { holding, shortage } = ROLE_COSTS[role]
    const holdingCost = inventoryAfterShipping[role] * holding
    const shortageCost = newBacklog[role] * shortage
    costs[role] = { holdingCost, shortageCost, weekCost: holdingCost + shortageCost }
  }

  const newPipeline = {}
  for (const role of ROLES) newPipeline[role] = [state.roles[role].pipeline[1], orders[role]]

  const weekSnapshot = {}
  for (const role of ROLES) {
    const newCumCost = state.roles[role].cumulativeCost + costs[role].weekCost
    weekSnapshot[role] = {
      wk:             week,
      recv:           received[role],
      dem:            incomingDemand[role],
      totalDemand:    totalDemand[role],
      sold:           shipment[role],
      inv:            inventoryAfterShipping[role],
      bl:             newBacklog[role],
      ord:            orders[role],
      hc:             costs[role].holdingCost,
      sc:             costs[role].shortageCost,
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
    const shortageWeeks = history.filter(w => w.bl > 0).length
    const orders = history.map(w => w.ord)
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
    mode:     finalState.demandMode,
    modeDesc: finalState.demandModeDesc || '',
    curve:    finalState.demandCurve,
    base:     finalState.demandBase,
    peak:     finalState.demandPeak,
  }

  return results
}

module.exports = { initGameState, processWeek, calculateResults }
