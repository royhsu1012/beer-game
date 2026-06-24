# 🍺 啤酒分销游戏

多人线上供应链教学游戏，体验牛鞭效应。

## 本地启动

```bash
# 后端
cd server && npm install && npm run dev

# 前端（另开终端）
cd client && npm install && npm run dev
```

前端：http://localhost:5173  
后端：http://localhost:8080

## 环境变量

复制 `.env.example` 为 `.env`：

```
# server/.env
PORT=8080
CLIENT_ORIGIN=http://localhost:5173

# client/.env
VITE_SOCKET_URL=http://localhost:8080
```

## 部署

- 前端：Vercel（连接 GitHub，root directory = client）
- 后端：Render（root directory = server，start command = node src/index.js）
