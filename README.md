# OfficeAI 产品手册

基于 VitePress 构建的产品文档网站，部署在 GitHub Pages。**内容即代码，AI 驱动自动更新**。

## 快速开始

```bash
npm install
npm run dev
```

浏览器打开 `http://localhost:5173/product-manual/` 即可预览。

## 常用命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 本地预览 |
| `npm run build` | 构建静态站点 |
| `npm run preview` | 预览构建结果 |
| `npm run deploy` | 导出 PDF + 构建 + 部署 |
| `npm run generate:changelog` | 从 release-manifest 生成更新日志 |

## 项目结构

```
├── index.md                       # 首页（产品入口导航）
├── .vitepress/config.mts          # VitePress 配置（侧边栏自动扫描目录）
├── public/                        # 静态资源
│   ├── officeai-logo.png
│   ├── icons/                     # 首页功能图标
│   ├── downloads/                 # PDF 导出文件
│   └── videos/                    # 产品演示视频
├── cove/                          # 文档内容
│   ├── index.md                   # 产品手册总入口
│   ├── client/                    # 客户端手册 — WPS 插件用户
│   ├── admin/                     # 服务端手册 — 系统管理员
│   ├── changelog/                 # 更新日志（自动生成）
│   └── whitepaper/                # 产品白皮书
├── scripts/
│   ├── generate-changelog.js      # 生成更新日志
│   ├── auto-update-docs.mjs       # AI 自动更新文档
│   ├── screenshot-docs.cjs        # 自动截图（Web 页面）+ 手动截图指引
│   ├── export-pdf.cjs             # 动态 PDF 导出
│   ├── download-images.sh         # 批量下载远程图片
│   └── export-word.sh             # Word 导出
└── .github/workflows/deploy.yml   # CI/CD 工作流
```

## 内容体系

产品手册按读者角色分为四部分：

| 手册 | 读者 | 内容 |
|------|------|------|
| 客户端手册 | 插件用户 | 安装、界面操作、9 大功能详解、常见问题 |
| 服务端手册 | 系统管理员 | 部署、模型配置、用户权限、安全审计 |
| 产品白皮书 | 决策层 / 采购方 | 产品定位、技术架构、部署形态、安全合规 |
| 更新日志 | 所有用户 | 每次版本更新的内容 |

## 自动化文档更新流程

当源仓库（cove-wps / cove-go）发布新版本时，系统自动触发：

```
源仓库发布新版本
    │
    ▼
repository_dispatch 事件
    │
    ▼
AI 分析代码变更（DeepSeek）
    │
    ▼
同时产出三件套：
  ├── 更新日志条目
  ├── 操作手册新页面
  └── 白皮书产品矩阵更新
    │
    ▼
自动截图（浏览器可渲染的页面）+ 手动截图指引
    │
    ▼
创建分支 + Pull Request
    │
    ▼
飞书通知：审核文档
    │
    ▼
人工审核 → 合并到 main → 自动构建部署
```

### 关键设计

**侧边栏自动同步** — 侧边栏在构建时自动扫描 `cove/client/` 和 `cove/admin/` 目录生成。新增页面只要按命名规范放在对应目录，就会自动出现在导航中，无需手动维护配置。

**截图混合策略** — 插件界面（sidebar/settings/plugin 等）以独立 React 页面运行，可由 Playwright 自动截图。需要 WPS 上下文的功能截图会生成手动指引，通过飞书通知告知。

**PDF 导出动态页** — 导出脚本自动发现所有手册页面，新增功能页无需修改导出配置。

**人工审核门禁** — AI 更新推送到独立分支 + 创建 PR，飞书发送审核通知（如需手动截图会一并告知）。审核通过合并到 main 后才触发构建部署。

### 手动触发 AI 更新

在 GitHub Actions 页 → "构建并部署产品手册" → "Run workflow" → 选择 **ai-update** 模式 → 指定源仓库和版本号，即可手动触发一次 AI 文档更新。流程与源仓库自动触发完全一致。（GitHub Actions 页入口：仓库顶部 Tab → Actions）

## 部署流程

```
push → main
    │
    ▼
 构建网站 → 导出 PDF → 部署 GitHub Pages → 飞书通知
```

工作流文件：`.github/workflows/deploy.yml`

触发方式：
- **自动**：合并 PR 到 `main` 分支
- **手动**：GitHub Actions 页 → "Run workflow"
- **API**：`repository_dispatch`（由源仓库发布事件触发）
