# 🍺 啤酒供應鏈遊戲 Beer Distribution Game

> 四人連線・供應鏈教學模擬・體驗牛鞭效應・Pixel Art 風格

[![Node](https://img.shields.io/badge/Node.js-v22+-green?logo=node.js)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react)](https://react.dev)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![Cost](https://img.shields.io/badge/Hosting-完全免費-brightgreen)](#部署上線完全免費)

---

## 🎮 遊戲簡介

基於麻省理工學院（MIT）Sloan 管理學院的「啤酒分銷遊戲」，讓四名玩家分別扮演供應鏈中的不同角色，在**資訊不對稱**的情況下做決策，親身體驗**牛鞭效應（Bullwhip Effect）**的產生與影響。

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
| 🎭 Pixel Art 角色 | 四個 20×24 精細像素角色，含動畫 |
| 🔤 中文像素字體 | 採用 Cubic 11 開源中文 Pixel 字體 |
| 🎲 動態隨機需求 | 週期性隨機公式生成（正弦波+趨勢+噪音+衝擊），每局不同 |
| 🔒 資訊隔離 | 服務器端保證每人只收到自己角色的數據 |
| ⚡ 實時多人 | WebSocket 同步，支援手機瀏覽器 |
| 📊 複盤可視化 | 牛鞭效應折線圖 + 需求模式揭曉 |
| 🏆 排行榜 | 本地最佳紀錄儲存 |
| 💰 零成本部署 | Vercel + Render 完全免費 |

---

## 🎭 四個角色

| 角色 | 顏色 | 外觀 | 胜利條件 | 優秀門檻 |
|------|------|------|---------|---------|
| 🏪 零售商 | 🔵 藍 | 藍圍裙店長 | 總成本最低・缺貨週數為零 | < $150 |
| 📦 批發商 | 🟢 綠 | 綠安全帽倉管 | 總成本最低・滿足率≥95% | < $200 |
| 🚛 分銷商 | 🟡 黃 | 黃夾克墨鏡司機 | 總成本最低・訂單波動最小 | < $250 |
| 🏭 製造商 | 🔴 紅 | 紅安全帽鬍子工程師 | 總成本最低・生產量最穩定 | < $300 |

**團隊勝利：** 四人總成本之和 < $700

---

## 🎲 需求曲線公式

每局開始時動態生成，遊戲結束前不揭露：

```javascript
需求[週] = 基礎值
         + amp1 × sin(2π × t / period1 + phase1)   // 主週期
         + amp2 × sin(2π × t / period2 + phase2)   // 次諧波
         + trend × t                                 // 長期趨勢
         + noise × random()                         // 白噪音
         + shock_events                             // 0-2個突發衝擊
```

四種自動識別模式：

| 模式 | 說明 | 難度 |
|------|------|------|
| ☀️ 夏季旺季型 | 中段需求高峰 | ★★☆ |
| ❄️ 冬季旺季型 | 後段持續走高 | ★★★ |
| ⚡ 雙重衝擊型 | 兩次突發暴增 | ★★★★ |
| 💥 突發衝擊型 | 單次需求暴增 | ★★★ |
| 📈 自然波動型 | 週期性自然波動 | ★★☆ |

---

## 🕹️ 遊戲規則

- 共 **20 週**，每週 **60 秒** 內提交決策
- 前置時間：下單後 **2 週** 到貨
- 持有成本：**$0.50 / 箱 / 週**
- 缺貨成本：**$1.00 / 箱 / 週**
- 期初庫存：**12 箱**，期初在途：**各 4 箱**
- 所有計算在**後端**進行，前端只顯示

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

React + Vite 前端                  ← Vercel 免費托管
Cubic 11 中文 Pixel 字體
Canvas 繪製像素角色
Chart.js 走勢圖
```

### 後端核心檔案

```
server/src/
├── index.js         # Express + Socket.io 服務器入口
├── GameEngine.js    # 純函數遊戲引擎（回合結算）
├── RoomManager.js   # 記憶體房間管理（Map）
└── gameConfig.js    # 遊戲常數 + 動態需求曲線生成
```

### 前端頁面

```
client/src/
├── pages/
│   ├── Home.jsx     # 輸入名字，創建/加入房間
│   ├── Room.jsx     # 等待室，選擇角色
│   ├── Game.jsx     # 遊戲主介面
│   └── Debrief.jsx  # 複盤頁面
├── components/
│   ├── RoleCard.jsx # 角色介紹彈窗（含 Pixel 角色）
│   └── GameChart.jsx# Chart.js 走勢圖
├── roleConfig.js    # 角色配置（文字/顏色/提示）
└── gameConfig.js    # 遊戲常數（與後端同步）
```

### Socket.io 事件

| 客戶端 → 服務器 | 說明 |
|----------------|------|
| `create_room` | 創建房間 |
| `join_room` | 加入房間 |
| `select_role` | 選擇角色 |
| `start_game` | 開始遊戲 |
| `submit_order` | 提交本週決策 |

| 服務器 → 客戶端 | 說明 |
|----------------|------|
| `room_updated` | 等待室狀態更新 |
| `game_started` | 遊戲開始 |
| `week_started` | 新回合開始 |
| `week_results` | 本週結算（只有自己的數據）|
| `submission_progress` | 提交進度 |
| `game_finished` | 遊戲結束，揭露所有數據 |

---

## 🚀 本地開發

### 環境需求

- Node.js v18+

### 快速啟動

```bash
# 克隆專案
git clone https://github.com/royhsu1012/beer-game.git
cd beer-game

# 後端（CMD 視窗 1）
cd server
cp .env.example .env
npm install
npm run dev        # 啟動於 http://localhost:8080

# 前端（CMD 視窗 2）
cd ../client
cp .env.example .env
npm install
npm run dev        # 啟動於 http://localhost:5173
```

打開瀏覽器：`http://localhost:5173`

### 環境變數

**server/.env**
```env
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env**
```env
VITE_SOCKET_URL=http://localhost:8080
```

---

## ☁️ 部署上線（完全免費）

### 架構圖

```
玩家手機/電腦
      ↓
Vercel（前端） ← yourapp.vercel.app
      ↓ WebSocket
Render（後端） ← yourapp.onrender.com
```

### Step 1：部署後端到 Render

1. 前往 [render.com](https://render.com) 用 GitHub 登入
2. **New → Web Service → 選 beer-game repo**
3. 填寫設定：

   | 項目 | 值 |
   |------|-----|
   | Root Directory | `server` |
   | Build Command | `npm install` |
   | Start Command | `node src/index.js` |

4. 新增環境變數：
   - `CLIENT_ORIGIN` = `https://你的名字.vercel.app`（之後更新）
   - `NODE_ENV` = `production`

5. 部署完成，記下網址：`https://beer-game-xxxx.onrender.com`

### Step 2：部署前端到 Vercel

1. 前往 [vercel.com](https://vercel.com) 用 GitHub 登入
2. **New Project → Import beer-game**
3. 填寫設定：

   | 項目 | 值 |
   |------|-----|
   | Root Directory | `client` |
   | Framework | Vite |

4. 新增環境變數：
   - `VITE_SOCKET_URL` = `https://beer-game-xxxx.onrender.com`

5. 部署完成，得到：`https://beer-game-xxxx.vercel.app`

### Step 3：更新 Render 的 CLIENT_ORIGIN

回到 Render → Environment → 把 `CLIENT_ORIGIN` 改成 Vercel 網址 → Save。

### 防止 Render 休眠

免費實例閒置 15 分鐘會休眠。前往 [uptimerobot.com](https://uptimerobot.com) 設定每 14 分鐘 ping：

```
https://beer-game-xxxx.onrender.com/health
```

---

## 💰 費用明細

| 服務 | 平台 | 免費額度 | 月費 |
|------|------|---------|------|
| 前端托管 | Vercel | 無限帶寬・100GB | $0 |
| 後端托管 | Render | 512MB RAM・750h/月 | $0 |
| 網域 | yourapp.vercel.app | 子域名免費 | $0 |
| **總計** | | | **$0** |

---

## 📚 教學目標

遊戲結束後，玩家應能理解：

| 概念 | 體驗方式 |
|------|---------|
| 牛鞭效應的成因 | 親眼看到自己的訂單如何放大上游波動 |
| 局部最優 ≠ 整體最優 | 每人都在「理性」決策，整體供應鏈卻崩潰 |
| 資訊不對稱的代價 | 只看到自己數據，無法知道上下游狀況 |
| 前置時間的影響 | 訂貨 2 週才到，預測難度大增 |
| 系統思維的重要性 | 複盤揭示全局數據，對比個人視角 |

### 現實中緩解牛鞭效應的方法

- **POS 數據共享** — 零售商直接共享銷售數據給上游
- **VMI（供應商管理庫存）** — 由供應商決定補貨量
- **縮短前置時間** — 快速補貨降低不確定性
- **CPFR** — 協同規劃、預測與補貨
- **EDLP** — 每日低價，消除價格波動誘因

---

## 🗂️ Demo 單機版

`demo/beer_game_demo.html` — 單一 HTML 檔案，無需安裝，直接瀏覽器打開即可遊玩。

- 單人模式（AI 自動扮演其他三個角色）
- 完整遊戲流程（選角色 → 遊戲 → 複盤）
- 包含所有 Pixel Art 效果與中文界面

---

## 🔄 更新代碼

本專案使用 **Claude.ai 直接推送 GitHub**：

推送後 Render 和 Vercel 會**自動重新部署**，無需手動操作。

---

## 📄 License

MIT License — 自由使用於教學用途

---

*本專案由 Claude.ai 協助開發 · 供應鏈教育工具 · 2025*
