/**
 * 需求曲线生成器
 * 
 * 生成有季节性波动的需求曲线，每局游戏略有不同
 * 玩家不知道曲线的具体数值，只能根据当周需求做判断
 * 
 * 季节模式（随机选一种）：
 *   summer  — 夏季旺季：中段需求高峰
 *   winter  — 冬季旺季：后段需求高峰  
 *   bimodal — 双峰：前期和后期各一次高峰
 *   shock   — 突发冲击：某周突然暴增再回落
 */
function generateDemandCurve(seed) {
  // 简单线性同余随机数（可复现）
  let s = seed || Math.floor(Math.random() * 99999)
  function rand() { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  function randInt(min, max) { return Math.floor(rand() * (max - min + 1)) + min }

  const modes = ['summer', 'winter', 'bimodal', 'shock']
  const mode = modes[Math.floor(rand() * modes.length)]
  const base = randInt(3, 5)       // 基础需求 3~5 箱
  const peak = randInt(8, 14)      // 高峰需求 8~14 箱
  const noise = () => randInt(-1, 1) // 每周随机噪音

  const curve = []

  for (let w = 1; w <= 20; w++) {
    let demand = base

    if (mode === 'summer') {
      // 夏季：第6-14周高峰，其余平稳
      if (w >= 6 && w <= 14) demand = peak
      else demand = base

    } else if (mode === 'winter') {
      // 冬季：第12-20周高峰
      if (w >= 12) demand = peak
      else demand = base

    } else if (mode === 'bimodal') {
      // 双峰：第4-7周 & 第14-17周各一次
      if ((w >= 4 && w <= 7) || (w >= 14 && w <= 17)) demand = peak
      else demand = base

    } else if (mode === 'shock') {
      // 突发冲击：某周暴增，之后回落
      const shockWeek = randInt(5, 12)
      if (w === shockWeek) demand = peak + randInt(4, 8)
      else if (w === shockWeek + 1) demand = Math.floor(peak * 0.6)
      else demand = base
    }

    // 加入随机噪音，并确保需求最小为1
    curve.push(Math.max(1, demand + noise()))
  }

  return { curve, mode, base, peak, seed: s }
}

const GAME_CONFIG = {
  TOTAL_WEEKS: 20,
  LEAD_TIME: 2,
  INITIAL_INVENTORY: 12,
  INITIAL_PIPELINE: [4, 4],
  HOLDING_COST: 0.50,
  SHORTAGE_COST: 1.00,
  ROUND_TIME_SECONDS: 60,
  ROLES: ['retailer', 'wholesaler', 'distributor', 'manufacturer'],
  generateDemandCurve,
  EXCELLENT_THRESHOLD: {
    retailer: 150,
    wholesaler: 200,
    distributor: 250,
    manufacturer: 300,
    team: 700
  }
}

module.exports = GAME_CONFIG
