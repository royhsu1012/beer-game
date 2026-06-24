# 🍺 啤酒分销游戏 Beer Distribution Game

> 四人线上供应链教学平台 · 体验牛鞭效应 · 像素风格角色

![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-v22+-green)
![React](https://img.shields.io/badge/react-18-61dafb)
![Cost](https://img.shields.io/badge/hosting-FREE-brightgreen)

---

## 🎮 游戏简介

基于麻省理工学院（MIT）Sloan 管理学院的「啤酒分销游戏」，四名玩家分别扮演供应链中的不同角色，在**信息不对称**的情况下做决策，亲身体验**牛鞭效应（Bullwhip Effect）**的产生与影响。

```
消费者需求
    ↓
🏪 零售商  →  📦 批发商  →  🚛 分销商  →  🏭 制造商
```

每个玩家**只能看到自己的数据**，无法得知上下游的库存或订单量。

---

## ✨ 核心特色

- 🎭 **四角色像素风格角色** — 零售商・批发商・分销商・制造商，各有专属视觉
- 🎲 **动态季节性需求** — 每局随机生成（夏季旺季 / 冬季旺季 / 双峰 / 突发冲击），游戏结束才揭露
- 🔒 **信息隔离** — 服务器端保证每人只收到自己角色的数据
- ⚡ **实时多人** — WebSocket 同步，支援手机浏览器
- 📊 **复盘可视化** — 游戏结束后揭露牛鞭效应全景图
- 💰 **零成本部署** — Vercel + Render 完全免费

---

## 🎯 四个角色

| 角色 | 颜色 | 特色 | 胜利条件 | 优秀门槛 |
|------|------|------|---------|---------|
| 🏪 零售商 | 🔵 蓝 | 蓝围裙店员，直面消费者 | 总成本最低・缺货周数为零 | < $150 |
| 📦 批发商 | 🟢 绿 | 绿安全帽仓管，手持clipboard | 总成本最低・满足率≥95% | < $200 |
| 🚛 分销商 | 🟡 黄 | 黄夹克司机，戴墨镜 | 总成本最低・订单波动最小 | < $250 |
| 🏭 制造商 | 🔴 红 | 红安全帽工程师，拿扳手 | 总成本最低・生产量最稳定 | < $300 |

**团队胜利：** 四人总成本之和 < $700

---

## 🎲 动态需求模式

每局开始时随机生成，**游戏结束后才揭露**：

| 模式 | 说明 | 难度 |
|------|------|------|
| ☀️ 夏季旺季型 | 第 6-14 周进入需求高峰 | ★★☆ |
| ❄️ 冬季旺季型 | 第 12 周起需求持续走高 | ★★★ |
| 📈 双峰型 | 两次需求高峰，中间有低谷 | ★★★ |
| ⚡ 突发冲击型 | 某周需求暴增后迅速回落 | ★★★★ |

---

## 🕹️ 游戏规则

- 共 **20 周**，每周 **60 秒**内提交决策
- 前置时间：下单后 **2 周**到货
- 持有成本：**$0.50 / 箱 / 周**
- 缺货成本：**$1.00 / 箱 / 周**
- 期初库存：**12 箱**，期初在途：**各 4 箱**
- 所有计算在**后端**进行，前端只负责显示

---

## 🏗️ 技术架构

```
玩家浏览器（手机/电脑）
        ↕ WebSocket
┌─────────────────────────────┐
│  Node.js + Express          │  ← Render 免费托管
│  Socket.io 实时通信          │
│  GameEngine.js 纯函数        │
│  RoomManager.js 内存房间     │
└─────────────────────────────┘

React + Vite 前端             ← Vercel 免费托管
Chart.js 图表
像素风格 CSS 角色
```

### 后端核心档案

```
server/src/
├── index.js          # Express + Socket.io 服务器入口
├── GameEngine.js     # 纯函数游戏引擎（回合结算）
├── RoomManager.js    # 内存房间管理（Map）
└── gameConfig.js     # 游戏常数 + 动态需求曲线生成
```

### 前端页面

```
client/src/
├── pages/
│   ├── Home.jsx      # 输入名字，创建/加入房间
│   ├── Room.jsx      # 等待室，选择角色
│   ├── Game.jsx      # 游戏主界面
│   └── Debrief.jsx   # 复盘页面
├── components/
│   ├── RoleCard.jsx  # 角色介绍弹窗（含像素角色）
│   └── GameChart.jsx # Chart.js 图表
├── roleConfig.js     # 角色配置（文字/颜色/提示）
└── gameConfig.js     # 游戏常数（与后端同步）
```

### Socket.io 事件

| 客户端 → 服务器 | 说明 |
|----------------|------|
| `create_room` | 创建房间 |
| `join_room` | 加入房间 |
| `select_role` | 选择角色 |
| `start_game` | 开始游戏 |
| `submit_order` | 提交本周决策 |

| 服务器 → 客户端 | 说明 |
|----------------|------|
| `room_updated` | 等待室状态更新 |
| `game_started` | 游戏开始（各人收到自己角色数据）|
| `week_started` | 新回合开始 |
| `week_results` | 本周结算（只有自己的数据）|
| `submission_progress` | 提交进度（X/4人）|
| `game_finished` | 游戏结束，首次公开所有数据 |

---

## 🚀 本地启动

### 环境要求

- Node.js v18+
- npm v9+

### 安装步骤

```bash
# 克隆专案
git clone https://github.com/royhsu1012/beer-game.git
cd beer-game

# 后端
cd server
cp .env.example .env    # 复制环境变量
npm install
npm run dev             # 启动在 http://localhost:8080

# 前端（另开终端）
cd ../client
cp .env.example .env    # 复制环境变量
npm install
npm run dev             # 启动在 http://localhost:5173
```

### 环境变量

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

## ☁️ 部署上线（完全免费）

### Step 1：部署后端到 Render

1. 去 [render.com](https://render.com) 用 GitHub 登入
2. **New → Web Service → 选 beer-game repo**
3. 填写设定：

   | 项目 | 值 |
   |------|-----|
   | Root Directory | `server` |
   | Build Command | `npm install` |
   | Start Command | `node src/index.js` |

4. 加环境变量：
   - `CLIENT_ORIGIN` = `https://你的名字.vercel.app`
   - `NODE_ENV` = `production`

5. 部署完成，记下网址：`https://beer-game-xxxx.onrender.com`

### Step 2：部署前端到 Vercel

1. 去 [vercel.com](https://vercel.com) 用 GitHub 登入
2. **New Project → Import beer-game**
3. 填写设定：

   | 项目 | 值 |
   |------|-----|
   | Root Directory | `client` |
   | Framework | Vite |

4. 加环境变量：
   - `VITE_SOCKET_URL` = `https://beer-game-xxxx.onrender.com`

5. 部署完成，得到：`https://beer-game-xxxx.vercel.app`

### Step 3：互相更新网址

回到 Render，把 `CLIENT_ORIGIN` 改成 Vercel 给的网址，重新部署。

### 防止 Render 休眠

免费实例闲置 15 分钟会休眠。去 [uptimerobot.com](https://uptimerobot.com) 设定每 14 分钟 ping：
```
https://beer-game-xxxx.onrender.com/health
```

---

## 🔄 更新代码

本专案使用 **Claude.ai 直接推送 GitHub**：

- 推送后 Render 和 Vercel 会**自动重新部署**
- 无需手动操作
- 可从手机上通过 Claude.ai 对话修改代码

---

## 📚 教学目标

游戏结束后，玩家应能理解：

| 概念 | 体验方式 |
|------|---------|
| 牛鞭效应的成因 | 亲眼看到自己的订单如何放大上游波动 |
| 局部最优≠整体最优 | 每人都在「理性」决策，整体供应链却崩溃 |
| 信息不对称的代价 | 只看到自己数据，无法知道上下游状况 |
| 前置时间的影响 | 订货 2 周才到，预测难度大增 |
| 系统思维的重要性 | 复盘揭示全局数据，对比个人视角 |

### 缓解牛鞭效应的现实方案

- **POS 数据共享** — 零售商将销售数据直接共享给上游
- **VMI（供应商管理库存）** — 由供应商决定补货量
- **缩短前置时间** — 快速补货能力降低不确定性
- **CPFR** — 协同规划、预测与补货
- **EDLP（每日低价）** — 消除价格波动诱因

---

## 💰 成本明细

| 服务 | 平台 | 免费额度 | 月费 |
|------|------|---------|------|
| 前端托管 | Vercel | 无限带宽・100GB | $0 |
| 后端托管 | Render | 512MB RAM・750h/月 | $0 |
| 域名 | yourapp.vercel.app | 子域名免费 | $0 |
| **总计** | | | **$0** |

---

## 📄 License

MIT License — 自由使用于教学用途

---

*本专案由 Claude.ai 协助开发 · 供应链教育工具*
