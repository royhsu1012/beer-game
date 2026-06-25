/**
 * gameConfig.js
 * 遊戲常數 + 動態週期性需求曲線生成器
 *
 * 需求公式：
 *   D[t] = base
 *         + amp1 × sin(2π × t / period1 + phase1)   主週期
 *         + amp2 × sin(2π × t / period2 + phase2)   次諧波
 *         + trend × t                                長期趨勢
 *         + noise × random()                         白噪音
 *         + Σ shock_events                           突發衝擊
 *
 * 每局種子不同（Date.now），確保每局曲線唯一。
 * 模式在遊戲結束複盤時才揭露。
 */

// ── 線性同餘隨機數生成器（可控種子）────────────────────────────
function makeLCG(seed) {
  let s = seed
  return {
    next: () => {
      s = (s * 1664525 + 1013904223) & 0x7fffffff
      return s / 0x7fffffff
    },
    range: (a, b) => a + (b - a) * (s = (s * 1664525 + 1013904223) & 0x7fffffff, s / 0x7fffffff),
    int:   (a, b) => Math.floor(a + (b - a + 0.999) * (s = (s * 1664525 + 1013904223) & 0x7fffffff, s / 0x7fffffff)),
  }
}

/**
 * 生成本局需求曲線
 * @param {number} [seed] - 隨機種子（省略則用當前時間戳）
 * @returns {{ curve, mode, modeDesc, base, peak }}
 */
function generateDemandCurve(seed) {
  const rng = makeLCG(seed || (Date.now() % 999983))

  const base     = rng.range(4.0, 7.0)   // 基礎需求均值
  const amp1     = rng.range(3.0, 6.0)   // 主週期振幅
  const period1  = rng.range(6,  14)     // 主週期長度（週）
  const phase1   = rng.range(0, 6.28)    // 主週期相位
  const amp2     = rng.range(0.5, 1.8)   // 次諧波振幅
  const period2  = rng.range(3,   7)     // 次諧波週期
  const phase2   = rng.range(0, 6.28)    // 次諧波相位
  const trend    = rng.range(-0.1, 0.15) // 長期趨勢（負=下降 正=上升）
  const noiseAmp = rng.range(1.0,  2.0)  // 白噪音強度

  // 突發衝擊事件（至少 1 次，最多 3 次）
  const shockCount = rng.int(1, 3)
  const shocks = []
  for (let i = 0; i < shockCount; i++) {
    shocks.push({
      week: rng.int(3, 18),
      magnitude: rng.range(4.0, 10.0),  // 衝擊強度加大
      sign: rng.next() > 0.4 ? 1 : -1, // 70% 正向衝擊
    })
  }

  // 生成 20 週曲線
  const curve = []
  for (let w = 1; w <= 20; w++) {
    const t = w - 1
    let d = base
      + amp1 * Math.sin(2 * Math.PI * t / period1 + phase1)
      + amp2 * Math.sin(2 * Math.PI * t / period2 + phase2)
      + trend * t
      + noiseAmp * (rng.next() * 2 - 1)

    // 套用衝擊事件（距離衝擊週越近，影響越大）
    for (const sh of shocks) {
      const dist = Math.abs(w - sh.week)
      if (dist <= 2) d += sh.sign * sh.magnitude * (1 - dist * 0.4)
    }

    curve.push(Math.max(1, Math.round(d)))
  }

  // 自動識別需求模式（供複盤揭曉用）
  const maxVal  = Math.max(...curve)
  const minVal  = Math.min(...curve)
  const maxWeek = curve.indexOf(maxVal) + 1

  let mode, modeDesc
  if (shockCount >= 2) {
    mode     = '⚡ 雙重衝擊型'
    modeDesc = '本局出現兩次突發需求衝擊，考驗快速應變能力。'
  } else if (shockCount === 1) {
    mode     = '💥 突發衝擊型'
    modeDesc = `第 ${shocks[0].week} 週附近出現需求暴增，之後迅速回落。`
  } else if (maxWeek >= 6 && maxWeek <= 14) {
    mode     = '☀️ 夏季旺季型'
    modeDesc = '中段（第6-14週）需求走高，頭尾較平穩，需提前備貨。'
  } else if (maxWeek >= 14) {
    mode     = '❄️ 冬季旺季型'
    modeDesc = '後半段需求持續走高，越到後期供應壓力越大。'
  } else {
    mode     = '📈 自然波動型'
    modeDesc = '需求呈自然週期波動，有漲有跌，考驗預測能力。'
  }

  return {
    curve,
    mode,
    modeDesc,
    base: Math.round(minVal),
    peak: Math.round(maxVal),
  }
}

// ── 遊戲常數 ────────────────────────────────────────────────────
const GAME_CONFIG = {
  TOTAL_WEEKS:       20,
  LEAD_TIME:         2,        // 前置時間（週）
  INITIAL_INVENTORY: 12,       // 期初庫存（各角色相同）
  INITIAL_PIPELINE:  [4, 4],   // 期初在途 [下週到, 後週到]
  // 各角色不同成本結構
  ROLE_COSTS: {
    retailer:     { holding: 0.10, shortage: 1.00 },
    wholesaler:   { holding: 0.15, shortage: 0.70 },
    distributor:  { holding: 0.20, shortage: 0.50 },
    manufacturer: { holding: 0.30, shortage: 0.30 },
  },
  ROUND_TIME_SECONDS:60,       // 每週決策時限

  ROLES: ['retailer', 'wholesaler', 'distributor', 'manufacturer'],

  EXCELLENT_THRESHOLD: {
    retailer:     150,
    wholesaler:   200,
    distributor:  250,
    manufacturer: 300,
    team:         700,
  },

  generateDemandCurve,
}

module.exports = GAME_CONFIG
