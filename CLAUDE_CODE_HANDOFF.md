# 啤酒供應鏈遊戲 — Claude Code 交接文件

## 專案概況

**GitHub Repo**: `https://github.com/royhsu1012/beer-game`
**目前最新版**: `demo/beer_game_demo.html`（v20，多人房間制）
**後端服務**: `https://beer-game-server.onrender.com`（Node.js + Socket.io，已部署於 Render）

---

## 技術架構

```
beer-game/
├── demo/
│   └── beer_game_demo.html   ← 主遊戲（單頁 HTML，v20）
├── server/
│   └── src/
│       ├── index.js          ← Express + Socket.io 主程式
│       ├── RoomManager.js    ← 房間管理（建立/加入/選角色）
│       ├── GameEngine.js     ← 遊戲引擎（processWeek, calculateResults）
│       └── gameConfig.js     ← 遊戲常數 + 需求曲線生成器
├── client/                   ← React 前端（尚未完成，暫不使用）
└── docs/
```

---

## 遊戲設計核心

### 各角色成本結構
| 角色 | 售價 | 庫存費 | 缺貨罰 | 特色 |
|------|------|--------|--------|------|
| 零售商 | $3.00 | $0.10 | $1.00 | 缺貨最貴，傾向多備貨 |
| 批發商 | $2.00 | $0.15 | $0.70 | 兩者平衡 |
| 分銷商 | $1.40 | $0.20 | $0.50 | 庫存壓力漸增 |
| 製造商 | $1.00 | $0.30 | $0.30 | 庫存最貴，平穩生產最重要 |

- 起始資金：**$200**（各角色相同）
- 遊戲 **20 週**，每週 **60 秒**決策
- 前置時間 **2 週**，資訊隔離（各角色只看自己的數據）

### 需求公式（v20）
- base: 4-7，amp1: 3-6，保證至少 1 次衝擊（最多 3 次）
- 衝擊強度: 4-10

### 建議訂購量公式
```
建議量 = 目標庫存 − 現有庫存 − 在途 + 積壓
目標庫存 = 近3週平均收到的需求 × 1.5
```
各角色只用自己歷史收到的需求，保護資訊隔離。

---

## Socket.io 事件清單

### 前端 → 後端
| 事件 | payload | 說明 |
|------|---------|------|
| `create_room` | `{ name }` | 建立房間 |
| `join_room` | `{ roomCode, name }` | 加入房間 |
| `select_role` | `{ roomCode, role }` | 選角色（防重複） |
| `start_game` | `{ roomCode }` | 開始遊戲（房主限定） |
| `submit_order` | `{ quantity }` | 提交本週訂單 |

### 後端 → 前端
| 事件 | 說明 |
|------|------|
| `room_updated` | 房間狀態更新（玩家列表、角色） |
| `game_started` | 遊戲開始，包含初始狀態 |
| `week_started` | 新週開始 |
| `week_results` | 週結算，**只傳自己角色的數據** |
| `submission_progress` | 已提交人數 |
| `game_finished` | 遊戲結束，包含所有角色結果 |
| `player_disconnected` | 有玩家斷線 |

---

## 已知待辦事項

1. **GameEngine.js 的成本結構** 目前還是 `HOLDING_COST=0.50`（單一值），
   前端 HTML 已改成各角色不同，但後端還沒同步 → **需要更新 GameEngine.js**

2. **需求波動** gameConfig.js 的參數還是舊版（base 3.5-5.5），
   前端 HTML 已改大 → **需要更新 gameConfig.js**

3. **複盤頁** 多人模式下的複盤資料來自 `game_finished` 事件，
   目前只填了 cash/profit，**orderHistory 的牛鞭效應圖還需測試**

4. **斷線重連** 玩家斷線後目前直接通知其他人，
   尚未實作重連機制

---

## 如何在 Claude Code 繼續

### 1. Clone 專案
```bash
git clone https://github.com/royhsu1012/beer-game.git
cd beer-game
```

### 2. 啟動後端（本地測試）
```bash
cd server
npm install
npm run dev   # nodemon，port 8080
```

### 3. 修改前端
直接編輯 `demo/beer_game_demo.html`，用瀏覽器開啟即可。
如果要連本地後端，把 `SERVER_URL` 改成 `http://localhost:8080`。

### 4. 部署到 Render（後端）
- Render Dashboard 已設定 auto-deploy
- push 到 main branch 後自動部署
- 環境變數：`PORT=8080`

### 5. 部署前端
把 `demo/beer_game_demo.html` 放到 GitHub Pages 或直接用 Vercel 托管。

---

## Claude Code 推薦提示詞

開始新對話時，貼上：

```
我在繼續開發啤酒供應鏈遊戲（牛鞭效應教學模擬）。
請先讀取 CLAUDE_CODE_HANDOFF.md 了解專案背景。

主要工作：
1. 更新 server/src/GameEngine.js，讓各角色使用不同的 HOLD_COST 和 SHORT_COST
2. 更新 server/src/gameConfig.js，加大需求波動參數
3. 測試多人模式的完整流程（建房→選角色→遊戲→複盤）

後端: server/ (Node.js + Socket.io)
前端: demo/beer_game_demo.html (單頁 HTML)
```

---

## 重要檔案路徑

- 主遊戲 HTML：`demo/beer_game_demo.html`
- 後端入口：`server/src/index.js`
- 遊戲引擎：`server/src/GameEngine.js`
- 需求配置：`server/src/gameConfig.js`
- 房間管理：`server/src/RoomManager.js`
