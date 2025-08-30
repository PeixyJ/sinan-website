# Sinan Website

一个现代化的书签管理平台，帮助用户高效地组织和管理书签，支持空间、标签分类和团队协作。

## ✨ 功能特性

- 🔐 **用户认证系统** - 支持GitHub OAuth登录
- 📑 **书签管理** - 添加、编辑、删除和组织书签
- 🗂️ **空间管理** - 创建不同空间来分类管理书签
- 🏷️ **标签系统** - 为书签添加标签，便于快速筛选
- 👥 **团队协作** - 支持团队切换和协作功能
- 📱 **响应式设计** - 适配桌面和移动设备
- 🎨 **现代化UI** - 基于Tailwind CSS和Reka UI组件库

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **CSS框架**: Tailwind CSS 4.x
- **UI组件库**: Reka UI
- **路由管理**: Vue Router 4
- **状态管理**: VueUse
- **数据表格**: TanStack Vue Table
- **图标库**: Lucide Vue Next
- **拖拽功能**: VueDraggable
- **HTTP客户端**: Axios
- **动画库**: TW Animate CSS

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### 安装依赖

```bash
pnpm install
```

### 开发环境运行

```bash
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173) 查看应用

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## 📁 项目结构

```
src/
├── components/          # 组件库
│   ├── Authentication/  # 认证相关组件
│   ├── Base/           # 基础组件
│   ├── Bookmark/       # 书签管理组件
│   ├── Sidebar/        # 侧边栏组件
│   └── ui/            # UI组件库
├── pages/             # 页面组件
│   ├── dashboard/     # 仪表板页面
│   ├── login/         # 登录页面
│   └── github-callback/ # GitHub回调页面
├── services/          # API服务
├── types/            # TypeScript类型定义
├── lib/              # 工具库
├── utils/            # 工具函数
└── router.ts         # 路由配置
```

## 🐳 Docker 部署

项目包含Dockerfile，支持容器化部署：

```bash
docker build -t sinan-website .
docker run -p 3000:3000 sinan-website
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情
