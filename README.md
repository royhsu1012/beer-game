# 🍺 啤酒分销游戏 Beer Distribution Game

多人线上供应链教学游戏，4人同时在线，体验牛鞭效应。

---

## 本地开发

### 第一次启动

**开两个 CMD 视窗：**

CMD 1（后端）：
```bash
cd server
npm install
npm run dev
```

CMD 2（前端）：
```bash
cd client
npm install
npm run dev
```

打开浏览器：`http://localhost:5173`

### 环境变量

**server/.env**（复制 server/.env.example）：
```
PORT=8080
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env**（复制 client/.env.example）：
```
VITE_SOCKET_URL=http://localhost:8080
```

---

## 部署上线（免费）

### 架构

```
玩家手机/电脑
     ↓
Vercel（前端）← yourapp.vercel.app
     ↓ WebSocket
Render（后端）← yourapp.onrender.com
```

---

### Step 1：部署后端到 Render

1. 去 [render.com](https://render.com) 注册（用 GitHub 登入）

2. 点 **New → Web Service**

3. 连接 GitHub → 选 `beer-game` repo

4. 填写以下设定：

| 设定 | 值 |
|------|-----|
| Name | beer-game-server |
| Root Directory | server |
| Runtime | Node |
| Build Command | npm install |
| Start Command | node src/index.js |

5. 点 **Advanced → Add Environment Variable**：

| Key | Value |
|-----|-------|
| CLIENT_ORIGIN | https://你的名字.vercel.app（先填，之后更新）|
| NODE_ENV | production |

6. 点 **Create Web Service**

7. 等 3-5 分钟部署完成，记下你的网址：
   ```
   https://beer-game-server-xxxx.onrender.com
   ```

---

### Step 2：部署前端到 Vercel

1. 去 [vercel.com](https://vercel.com) 注册（用 GitHub 登入）

2. 点 **New Project → Import** → 选 `beer-game` repo

3. 填写以下设定：

| 设定 | 值 |
|------|-----|
| Root Directory | client |
| Framework Preset | Vite |

4. 点 **Environment Variables → Add**：

| Key | Value |
|-----|-------|
| VITE_SOCKET_URL | https://beer-game-server-xxxx.onrender.com（填 Render 给你的网址）|

5. 点 **Deploy**

6. 等 2-3 分钟，完成后你会得到：
   ```
   https://beer-game-xxxx.vercel.app
   ```

---

### Step 3：更新 Render 的 CLIENT_ORIGIN

1. 回到 Render → 你的 beer-game-server
2. 点 **Environment**
3. 把 `CLIENT_ORIGIN` 改成 Vercel 给你的网址：
   ```
   https://beer-game-xxxx.vercel.app
   ```
4. 点 **Save Changes**，Render 会自动重新部署

---

### Step 4：测试

用手机和电脑各开一个浏览器，进入：
```
https://beer-game-xxxx.vercel.app
```

一个人创建房间，另一个人输入房间码加入，选好角色就能开始游戏。

---

## 之后更新代码

因为使用 Claude.ai 直接推 GitHub，每次更新后：

**后端更新（Render 自动部署）：**
- 代码推上 GitHub 后 Render 自动重新部署（约 2-3 分钟）

**前端更新（Vercel 自动部署）：**
- 代码推上 GitHub 后 Vercel 自动重新部署（约 1-2 分钟）

不需要手动操作任何东西。

---

## 免费套餐限制

| 服务 | 限制 | 影响 |
|------|------|------|
| Render | 闲置 15 分钟后休眠 | 第一个玩家进来要等约 30 秒唤醒 |
| Vercel | 100GB 带宽/月 | 教学用途绰绰有余 |
| 总费用 | $0 | 完全免费 |

**解决 Render 休眠问题：**
去 [uptimerobot.com](https://uptimerobot.com) 免费注册，
新增监控 → 填入 `https://beer-game-server-xxxx.onrender.com/health`，
每 14 分钟自动 ping 一次，保持服务器唤醒。

---

## 游戏规则简介

- 4 个角色：零售商、批发商、分销商、制造商
- 共 20 周，每周 60 秒做决策
- 每个角色只能看到自己的库存和订单
- 持有成本 $0.50/箱/周，缺货成本 $1.00/箱/周
- 第 1-4 周消费者需求 4 箱，第 5 周起跳升至 8 箱
- 目标：总成本最低

## 技术栈

- 前端：React + Vite + Chart.js
- 后端：Node.js + Express + Socket.io
- 实时通信：WebSocket
- 托管：Vercel（前端）+ Render（后端）
- 费用：$0
