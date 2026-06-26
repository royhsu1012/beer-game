# 系統架構說明

## 整體架構

```
┌─────────────────────────────────────────────────────────┐
│                    玩家端（瀏覽器）                        │
│  docs/beer_game_demo.html（單一 HTML 檔案）               │
│  Canvas Pixel Art・Cubic 11 字體・Web Audio API          │
│  Socket.io-client（多人模式）                             │
└──────────────────────────┬────────────────────────────────┘
                           │ WebSocket (Socket.io)
┌──────────────────────────┴────────────────────────────────┐
│                    後端（Node.js）                         │
│  Express HTTP + CORS                                       │
│  Socket.io 事件處理                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ RoomManager  │  │ GameEngine   │  │  gameConfig    │  │
│  │（記憶體 Map） │  │ （純函數）   │  │ （需求生成）   │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

**部署：**
- 前端：GitHub Pages（`docs/` 目錄）
- 後端：Render 免費方案

---

## 資訊隔離機制

每週結算後，逐個 socket 發送，而非廣播，確保每個玩家只能看到自己的數據：

```javascript
// server/src/index.js - resolveWeek()
room.players.filter(p => !p.isBot).forEach(player => {
  io.to(player.socketId).emit('week_results', {
    week: weekSnapshot[player.role].wk,
    mine: weekSnapshot[player.role],  // 只有自己角色的數據
    consumerDemand                     // 消費者需求對所有人公開
  })
})
```

---

## 遊戲引擎（純函數設計）

```
GameEngine.js
│
├── initGameState()
│   └── 初始化四角色狀態（庫存12、積壓0、管道[0,0]）
│   └── 用 generateDemandCurve() 生成本局需求曲線
│
├── processWeek(state, orders) → { newState, weekSnapshot, consumerDemand }
│   ├── Step 1: 接收到貨（取 pipeline[0]）
│   ├── Step 2: 計算總需求（incoming + 積壓）
│   ├── Step 3: 出貨（min(庫存+到貨, 總需求)）
│   ├── Step 4: 計算成本（持有 + 缺貨）
│   ├── Step 5: 推進管道（[pipeline[1], 新訂單]）
│   └── Step 6: 累計成本、記錄週歷史
│
└── calculateResults(finalState) → rankings
    └── 排名、達標判定、需求模式標籤、全歷史
```

---

## 需求曲線生成

```javascript
// gameConfig.js - generateDemandCurve(seed)
需求[t] = base
        + amp1 × sin(2π × t / period1 + phase1)   // 主季節週期
        + amp2 × sin(2π × t / period2 + phase2)   // 次諧波
        + trend × t                                 // 長期趨勢
        + noiseAmp × random()                      // 白噪音
        + Σ shocks[i].magnitude × decay(dist)     // 突發衝擊（1-3個）
```

使用 LCG（線性同餘隨機數生成器）確保種子可重現。
需求模式在遊戲結束複盤時才揭露。

---

## 房間生命週期

```
create_room  → 生成6位房間碼，creatorId 記錄房主
join_room    → 加入，上限4人
add_bot      → 為空缺角色加入 Bot
select_role  → 選擇角色（不可重複）
start_game   → 須所有位置都有角色（人或Bot，最少2個）
               └→ initGameState() 建立本局遊戲狀態
               └→ 逐人發送 game_started（含個人初始狀態）
               └→ startRoundTimer(60s)

[每週迴圈]
submit_order → 玩家提交訂單
               └→ Bot 自動計算訂單
               └→ 若全人類玩家都提交：立刻結算
               └→ 若計時到：自動補齊未提交者（沿用上週）
               └→ processWeek() 計算結果（try-catch 保護）
               └→ 逐人發送 week_results（只有自己的數據）
               └→ 廣播 week_started（各人收到自己的狀態）
               └→ 若 week >= 20：game_finished（揭露所有數據）

[遊戲結束]
return_to_room → 房主重開遊戲室（resetRoom），所有人回到等待室
disconnect     → 若房主在 finished 狀態離開：emit host_left
```

---

## Bot 機制

```javascript
// server/src/index.js - calcBotOrder()
function calcBotOrder(roleState) {
  const recentDemands = roleState.weeklyHistory.slice(-3).map(h => h.dem)
  const avgDemand = recentDemands.length > 0
    ? average(recentDemands) : 4
  const inTransit = roleState.pipeline[0] + roleState.pipeline[1]
  const suggested = Math.round(avgDemand * 1.5)
    - roleState.inventory - inTransit + roleState.backlog
  return Math.max(0, suggested + Math.floor(Math.random() * 5) - 2)
}
```

---

## 斷線重連流程

```
disconnect（playing 狀態）
  → player.socketId = null, player.disconnected = true
  → 廣播 player_disconnected
  → 設 60 秒 reconnectTimer

reconnect_game（60秒內）
  → 更新 player.socketId，清除 reconnectTimer
  → socket.join(roomCode)
  → emit game_resumed（含當週狀態與歷史）

reconnectTimer 到期（60秒後）
  → player.isBot = true（Bot 接管）
  → 廣播 player_reconnected（timedOut: true）
```

---

## 錯誤處理

- `resolveWeek()` 整體包在 try-catch 中，拋錯時 emit `server_error` 給整個房間
- 客戶端 `week_started` 的 catch 會重設 `submitting = false` 並顯示 g-az，防止 UI 永久凍結
- 客戶端有 `server_error` handler，收到後解凍 UI 並顯示錯誤訊息
