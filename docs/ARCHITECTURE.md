# 系統架構說明

## 整體架構

```
┌─────────────────────────────────────────────────────────┐
│                    玩家端（瀏覽器）                        │
│                                                           │
│  React + Vite          Socket.io-client                  │
│  Cubic 11 字體          WebSocket 連線                    │
│  Canvas Pixel Art       即時雙向通信                      │
└──────────────────────────┬────────────────────────────────┘
                           │ WebSocket
┌──────────────────────────┴────────────────────────────────┐
│                    後端（Node.js）                         │
│                                                           │
│  Express HTTP 服務                                        │
│  Socket.io 事件處理                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ RoomManager  │  │ GameEngine   │  │  gameConfig    │  │
│  │（記憶體 Map） │  │ （純函數）   │  │ （需求生成）   │  │
│  └──────────────┘  └──────────────┘  └────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

## 資訊隔離機制

這是整個設計的核心，確保每個玩家只能看到自己的數據：

```javascript
// server/src/index.js
// 每週結算後，逐個 socket 發送，而非廣播
room.players.forEach(player => {
  io.to(player.socketId).emit('week_results', {
    week: snap[player.role].week,
    mine: snap[player.role],      // 只有自己的數據
    consumerDemand: consumerDemand // 零售商需求對所有人公開
  })
})
```

## 遊戲引擎（純函數設計）

```
GameEngine.js
│
├── initGameState(demandData)
│   └── 初始化四角色狀態（庫存12、積壓0、管道[4,4]）
│   └── 綁定本局需求曲線
│
├── processWeek(state, orders) → { newState, snap, cd }
│   ├── Step 1: 接收到貨（取 pipeline[0]）
│   ├── Step 2: 庫存加上到貨
│   ├── Step 3: 計算總需求（含積壓）
│   ├── Step 4: 出貨（min(庫存, 需求)）
│   ├── Step 5: 計算成本（持有 + 缺貨）
│   └── Step 6: 推進管道（[pipeline[1], 新訂單]）
│
└── calculateResults(finalState) → rankings
    └── 排名、達標判定、需求模式標籤
```

## 需求曲線生成公式

```javascript
// gameConfig.js - generateDemandCurve()
需求[t] = base
        + amp1 × sin(2π × t / period1 + phase1)   // 主季節週期
        + amp2 × sin(2π × t / period2 + phase2)   // 次諧波
        + trend × t                                 // 長期趨勢
        + noiseAmp × random()                      // 白噪音
        + Σ shocks[i].magnitude × decay(t)        // 突發衝擊
```

參數範圍：
- `base`: 3.5 ~ 5.5 箱
- `amp1`: 1.8 ~ 4.2 箱
- `period1`: 6 ~ 14 週
- `trend`: -0.1 ~ +0.15
- `shockCount`: 0 ~ 2 個

## Socket.io 房間生命週期

```
create_room → 玩家1建立房間，取得6位房間碼
join_room   → 玩家2/3/4輸入房間碼加入
select_role → 各玩家選擇角色（不可重複）
start_game  → 任意玩家觸發，四角色就位即可（最少2人）
              └→ initGameState() 建立本局遊戲狀態
              └→ 逐人發送 game_started（含個人初始狀態）
              └→ 啟動第一週計時器（60秒）

[每週迴圈]
submit_order → 玩家提交訂單
              └→ 若全員提交：立刻結算
              └→ 若計時到：自動補齊未提交者（沿用上週）
              └→ processWeek() 計算結果
              └→ 逐人發送 week_results（只有自己的數據）
              └→ 若 week >= 20：game_finished（首次揭露所有數據）
```

## 前端狀態流

```
Home.jsx ──(create/join)──→ Room.jsx ──(game_started)──→ Game.jsx ──(game_finished)──→ Debrief.jsx
                                                              ↑
                                                         WebSocket 事件驅動
                                                         week_started / week_results
                                                         submission_progress
```
