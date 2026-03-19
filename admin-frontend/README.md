# admin-frontend

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

# 后台管理系统 - 前端项目

基于 Vue 3 + Element Plus + TypeScript 构建的现代化后台管理系统前端。

## 技术栈

- **框架**: Vue 3 (Composition API)
- **UI 组件库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **构建工具**: Vite
- **语言**: TypeScript

## 功能特性

- ✅ 用户登录（含图片验证码）
- ✅ 用户注册
- ✅ JWT Token 认证
- ✅ 路由守卫（自动跳转登录页）
- ✅ 用户信息查询与修改
- ✅ 响应式布局
- ✅ 统一错误处理

## 项目结构

```
admin-frontend/
├── src/
│   ├── api/              # API 接口封装
│   │   ├── auth.ts       # 认证相关接口
│   │   └── user.ts       # 用户管理接口
│   ├── router/           # 路由配置
│   │   └── index.ts      # 路由定义 + 路由守卫
│   ├── utils/            # 工具函数
│   │   └── request.ts    # Axios 封装 + 拦截器
│   ├── views/            # 页面组件
│   │   ├── LoginView.vue       # 登录页
│   │   ├── HomeView.vue        # 主布局（含侧边栏和顶栏）
│   │   ├── DashboardView.vue   # 仪表盘
│   │   └── UsersView.vue       # 用户管理
│   ├── App.vue           # 根组件
│   └── main.ts           # 入口文件
├── vite.config.ts        # Vite 配置（含代理）
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

确保后端 NestJS 服务已启动在 `http://localhost:3000`

```bash
cd ../
pnpm start:dev
```

### 3. 启动前端开发服务器

```bash
npm run dev
```

访问：`http://localhost:5173`

### 4. 登录使用

1. 首次使用点击"立即注册"创建账号
2. 注册成功后使用用户名和密码登录
3. 登录时需要输入图片验证码（点击图片可刷新）

## API 代理配置

开发环境下，前端请求 `/api/*` 会自动代理到后端 `http://localhost:3000`

配置位置：`vite.config.ts`

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

## 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录下。

## 主要页面

### 登录页 (`/login`)
- 用户名 + 密码登录
- 图片验证码验证
- 注册功能

### 仪表盘 (`/`)
- 显示当前用户信息
- 系统状态概览

### 用户管理 (`/users`)
- 查看当前用户详细信息
- 修改用户名
- 修改密码

## 开发说明

### 添加新页面

1. 在 `src/views/` 创建 `.vue` 文件
2. 在 `src/router/index.ts` 添加路由
3. 在 `HomeView.vue` 侧边栏添加菜单项

### 添加新 API

在 `src/api/` 目录下创建对应的 API 文件，使用 `request` 实例发送请求。

## 注意事项

- Token 存储在 `localStorage` 中
- 请求失败会自动显示错误提示
- 401 错误会自动跳转到登录页
- 路由守卫会检查 Token 有效性
