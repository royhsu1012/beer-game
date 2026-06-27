# 🍺 啤酒供應鏈遊戲 Beer Distribution Game

> 多人連線・供應鏈教學模擬・體驗牛鞭效應・Pixel Art 風格

[![Node](https://img.shields.io/badge/Node.js-v18+-green?logo=node.js)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Cost](https://img.shields.io/badge/Hosting-完全免費-brightgreen)](#部署上線)

---

## 🎮 遊戲簡介

基於麻省理工學院（MIT）Sloan 管理學院的「啤酒分銷遊戲」，讓玩家分別扮演供應鏈中的不同角色，在**資訊不對稱**的情況下做決策，親身體驗**牛鞭效應（Bullwhip Effect）**的產生與影響。

```
消費者需求（動態隨機）
      ↓
🏪 零售商  →  📦 批發商  →  🚛 分銷商  →  🏭 製造商
```

每個玩家**只能看到自己的數據**，無法得知上下游的庫存或訂單量。

---

## ✨ 特色功能

| 功能 | 說明 |
|------|------|
| 🤖 電腦機器人 | 不足4人時可加入 Bot 填補角色 |
| 🎭 Pixel Art 角色 | 四個像素角色，含 Canvas 動畫 |
| 🔤 中文像素字體 | 採用 Cubic 11 開源中文 Pixel 字體 |
| 🎲 動態隨機需求 | 正弦波+趨勢+噪音+衝擊，每局不同 |
| 🔒 資訊隔離 | 伺服器端保證每人只收到自己角色的數據 |
| ⚡ 實時多人 | WebSocket 同步，支援手機瀏覽器 |
| 📊 複盤可視化 | 牛鞭效應折線圖 + 需求模式揭曉 |
| 🔄 斷線重連 | 60秒內重連可繼續遊戲，否則由 Bot 接管 |
| 💰 零成本部署 | GitHub Pages + Render 完全免費 |

---

## 🎭 四個角色

| 角色 | 賣價 | 進貨/生產 | 毛利率 | 持有費 | 缺貨罰 |
|------|------|-----------|--------|--------|--------|
| 🏪 零售商 | $30 | $18 | 40% | $3/箱/週 | $6/箱/週 |
| 📦 批發商 | $20 | $13 | 35% | $2/箱/週 | $4/箱/週 |
| 🚛 分銷商 | $14 | $10 | 29% | $2/箱/週 | $4/箱/週 |
| 🏭 製造商 | $10 | $8（生產成本）| 20% | $1/箱/週 | $2/箱/週 |

設計邏輯：
- 毛利率越接近消費者越高（零售商有定價權）
- 持有成本越接近消費者越高（賣場空間貴，工廠倉庫便宜）
- 缺貨罰 = 持有費 × 2（統一 1:2 比例）

---

## 🕹️ 遊戲規則

- 共 **20 週**，每週 **60 秒** 內提交決策
- 前置時間：下單後 **2 週** 到貨
- 期初庫存：**12 箱**，期初在途：**[0, 0]**（前兩週無到貨，考驗初期備貨判斷）
- 起始資金：**$2000**
- 未在時限內提交：自動沿用上週訂單量
- 所有結算在**後端**進行，前端只負責顯示

---

## 🏗️ 技術架構

```
玩家瀏覽器（手機 / 電腦）
        ↕ WebSocket (Socket.io)
┌─────────────────────────────────┐
│  Node.js + Express + Socket.io  │  ← Render 免費托管
│  GameEngine.js  純函數引擎       │
│  RoomManager.js 記憶體房間管理   │
│  gameConfig.js  動態需求生成     │
└─────────────────────────────────┘

docs/beer_game_demo.html           ← GitHub Pages 免費托管
（單一 HTML 檔案，含多人+單人模式）
```

### 後端核心檔案

```
server/src/
├── index.js         # Express + Socket.io 伺服器入口
├── GameEngine.js    # 純函數遊戲引擎（回合結算）
├── RoomManager.js   # 記憶體房間管理（Map）
└── gameConfig.js    # 遊戲常數 + 動態需求曲線生成
```

### Socket.io 事件

| 客戶端 → 伺服器 | 說明 |
|----------------|------|
| `create_room` | 創建房間 |
| `join_room` | 加入房間 |
| `add_bot` / `remove_bot` | 新增/移除 Bot |
| `select_role` / `deselect_role` | 選擇/取消角色 |
| `start_game` | 開始遊戲 |
| `submit_order` | 提交本週訂單 |
| `reconnect_game` | 斷線重連 |
| `return_to_room` | 房主重開遊戲室 |

| 伺服器 → 客戶端 | 說明 |
|----------------|------|
| `room_updated` | 等待室狀態更新 |
| `game_started` | 遊戲開始（含個人初始狀態）|
| `week_started` | 新回合開始（含最新庫存狀態）|
| `week_results` | 本週結算（只有自己的數據）|
| `submission_progress` | 提交進度（幾人已完成）|
| `game_finished` | 遊戲結束，揭露所有數據 |
| `server_error` | 伺服器錯誤通知（自動解凍 UI）|
| `room_reset` | 房主重開遊戲室 |
| `host_left` | 房主離開複盤頁 |
| `player_disconnected` | 玩家斷線通知 |
| `game_resumed` | 斷線重連成功，恢復遊戲狀態 |

---

## 🚀 本地開發

```bash
git clone https://github.com/royhsu1012/beer-game.git
cd beer-game/server
npm install
node src/index.js   # 啟動於 http://localhost:8080
```

打開 `docs/beer_game_demo.html` 於瀏覽器，將 `SERVER_URL` 改為 `http://localhost:8080`。

---

## ☁️ 部署上線

### 前端：GitHub Pages（免費）

1. GitHub repo → **Settings → Pages**
2. Source: `main` branch，Folder: `/docs`
3. 儲存，約 1 分鐘後生效

網址：`https://royhsu1012.github.io/beer-game/`

### 後端：Render（免費）

1. [render.com](https://render.com) → New Web Service → 選 beer-game repo
2. 設定：

   | 項目 | 值 |
   |------|-----|
   | Root Directory | `server` |
   | Build Command | `npm install` |
   | Start Command | `node src/index.js` |

3. 部署完成，得到：`https://beer-game-jnsf.onrender.com`

### 防止 Render 休眠

伺服器端已內建每 14 分鐘自動 ping `/health`，無需額外設定。

---

## 🤖 Bot 機制

- 房主可在等待室為每個空缺角色加入/移除 Bot
- Bot 使用**目標庫存策略**：`下單量 = max(0, 平均需求×1.5 - 庫存 - 在途 + 積壓 + 隨機噪音)`
- 玩家斷線 60 秒未重連，自動由 Bot 接管

---

## 📊 複盤內容

遊戲結束後揭露：
- 消費者實際需求曲線（遊戲中不可見）
- 四角色每週訂單量對比折線圖（牛鞭效應可視化）
- 各角色總成本、缺貨週數、訂單波動度排名
- 需求模式標籤（⚡ 三重衝擊型 / 💥 雙重衝擊型 / ☀️ 夏季旺季型 / ❄️ 冬季旺季型 / 💥 突發衝擊型）

---

## 📚 教學目標

| 概念 | 體驗方式 |
|------|---------|
| 牛鞭效應的成因 | 親眼看到自己的訂單如何放大上游波動 |
| 局部最優 ≠ 整體最優 | 每人都在「理性」決策，整體供應鏈卻崩潰 |
| 資訊不對稱的代價 | 只看到自己數據，無法知道上下游狀況 |
| 前置時間的影響 | 訂貨 2 週才到，預測難度大增 |

---

## 📄 License

MIT License — 自由使用於教學用途

---

*本專案由 Claude Code 協助開發 · 供應鏈教育工具 · 2026*
