# 啤酒供應鏈遊戲 — Claude Code 交接文件

## 專案概況

**GitHub Repo**: `https://github.com/royhsu1012/beer-game`
**前端（GitHub Pages）**: `https://royhsu1012.github.io/beer-game/`
**後端（Render）**: `https://beer-game-jnsf.onrender.com`
**目前最新版**: `docs/beer_game_demo.html`（多人房間制 + 單人 AI 模式）

---

## 技術架構

```
beer-game/
├── docs/
│   ├── beer_game_demo.html   ← 主遊戲（單頁 HTML）
│   ├── index.html            ← GitHub Pages 重導向入口
│   ├── ARCHITECTURE.md       ← 系統架構說明
│   └── GAMEPLAY.md           ← 遊戲規則說明
├── server/
│   └── src/
│       ├── index.js          ← Express + Socket.io 主程式
│       ├── RoomManager.js    ← 房間管理（建立/加入/選角色）
│       ├── GameEngine.js     ← 遊戲引擎（processWeek, calculateResults）
│       └── gameConfig.js     ← 遊戲常數 + 需求曲線生成器
└── docs/
```

---

## 遊戲設計核心

### 各角色定價與成本

| 角色 | 賣價 | 進貨/生產 | 毛利 | 持有費 | 缺貨罰 |
|------|------|-----------|--------|--------|--------|
| 零售商 | $30 | $12 | $18 (60%) | $3/週 | $9/週 |
| 批發商 | $20 | $8 | $12 (60%) | $2/週 | $6/週 |
| 分銷商 | $14 | $6 | $8 (57%) | $2/週 | $6/週 |
| 製造商 | $10 | $4 | $6 (60%) | $1/週 | $3/週 |

設計原則：
- 毛利：零售 > 批發 > 分銷 > 製造（$18 > $12 > $8 > $6）
- 持有成本：零售最高（賣場空間貴），製造最低（工廠倉庫便宜）
- 缺貨罰 = 持有費 × 3（1:3 比例，缺貨遠比囤貨痛）
- 起始資金：$2000

- 遊戲 **20 週**，每週 **60 秒** 決策
- 前置時間 **2 週**，資訊隔離（各角色只看自己的數據）
- 期初庫存：12 箱，期初在途：[0, 0]（第 1-2 週無到貨，考驗初期備貨判斷）

### 需求公式
- base: 4-7，amp1: 3-6，保證至少 1 次衝擊（最多 3 次），衝擊強度: 4-10

### 建議訂購量公式
```
建議量 = 目標庫存 − 現有庫存 − 在途 + 積壓
目標庫存 = 近3週平均收到的需求 × 1.5
```

---

## Socket.io 事件清單

### 前端 → 後端
| 事件 | payload | 說明 |
|------|---------|------|
| `create_room` | `{ name }` | 建立房間 |
| `join_room` | `{ roomCode, name }` | 加入房間 |
| `add_bot` / `remove_bot` | `{ roomCode, role }` | 新增/移除 Bot |
| `select_role` / `deselect_role` | `{ roomCode, role }` | 選角色 |
| `start_game` | `{ roomCode }` | 開始遊戲（房主限定） |
| `submit_order` | `{ quantity }` | 提交本週訂單 |
| `reconnect_game` | `{ roomCode, name }` | 斷線重連 |
| `return_to_room` | `{ roomCode }` | 房主重開遊戲室 |

### 後端 → 前端
| 事件 | 說明 |
|------|------|
| `room_updated` | 等待室狀態更新（玩家列表、角色） |
| `game_started` | 遊戲開始，含個人初始狀態 |
| `week_started` | 新回合開始，含最新庫存狀態 |
| `week_results` | 本週結算，**只傳自己角色的數據** |
| `submission_progress` | 已提交人數進度 |
| `game_finished` | 遊戲結束，揭露所有角色結果 |
| `server_error` | 伺服器錯誤通知，前端自動解凍 UI |
| `room_reset` | 房主重開遊戲室 |
| `host_left` | 房主離開複盤頁 |
| `player_disconnected` | 玩家斷線通知 |
| `game_resumed` | 斷線重連成功，恢復遊戲狀態 |

---

## 已知待辦事項

1. **GameEngine.js 成本結構** 目前 `HOLDING_COST` 為單一值，
   前端 HTML 已改各角色不同 → **需要同步更新 GameEngine.js**

2. **gameConfig.js 需求參數** 目前可能仍是舊版參數，
   前端 HTML 已改大 → **可驗證並更新 gameConfig.js**

3. **多人複盤牛鞭效應圖** `orderHistory` 折線圖在多人模式下需完整測試

4. **斷線重連** 已實作（60秒內重連恢復，逾時由 Bot 接管），但邊界情況未完整測試

---

## 重要 Bug 紀錄（已修復）

### 多人凍結（v1.7.0 修復）
- **症狀**：第 2 週後送出訂單，畫面停在「已提交 等待其他玩家 1/1」永不推進
- **根因**：`submission_progress` handler 覆寫 `g-wait` innerHTML，移除了 `g-sub-n` span；
  下一週 `doSubmit` 嘗試讀取 `g-sub-n` 拋出 TypeError，`socket.emit` 從未執行
- **修法**：`doSubmit` 改為自行重建整個 `g-wait` HTML（含新 `g-sub-n`），不依賴舊 DOM

---

## 如何在 Claude Code 繼續

### 1. 啟動後端（本地測試）
```bash
cd "C:/Users/royhs_hsu/OneDrive - Moxa Inc/beer-game/server"
node src/index.js   # 啟動於 http://localhost:8080
```

### 2. 修改前端
直接編輯 `docs/beer_game_demo.html`。
本地測試時，將檔案頂部 `SERVER_URL` 改為 `http://localhost:8080`；
完成後務必改回 `https://beer-game-jnsf.onrender.com`。

### 3. 部署
- **前端**：push 到 main branch，GitHub Pages 自動更新（約 1 分鐘）
- **後端**：push 到 main branch，Render auto-deploy 自動重新部署

### 4. 防止 Render 休眠
伺服器端已內建每 14 分鐘自動 ping `/health`，無需額外設定。

---

## 重要檔案路徑

- 主遊戲 HTML：`docs/beer_game_demo.html`
- 後端入口：`server/src/index.js`
- 遊戲引擎：`server/src/GameEngine.js`
- 需求配置：`server/src/gameConfig.js`
- 房間管理：`server/src/RoomManager.js`
