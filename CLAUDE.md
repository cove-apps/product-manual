# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

OfficeAI 产品手册网站，基于 VitePress 构建的静态文档站，部署到 GitHub Pages。

产品是 OfficeAI（原名 Cove），一个 WPS 文档插件，提供校对、排版、翻译、总结等 AI 功能。

## 常用命令

```bash
npm run dev                 # 本地开发，启动 VitePress 预览
npm run build               # 构建静态网站
npm run preview             # 预览构建产物
npm run generate:changelog  # 从 release-manifest.json 生成更新日志
npm run export:pdf          # 用 Puppeteer 导出各手册为 PDF
npm run deploy              # export:pdf + build（完整发布流程）
```

## 目录结构

```
.vitepress/
  config.mts          # VitePress 配置；侧边栏自动扫描目录生成
cove/                  # 文档内容
  client/             # 客户端手册 - WPS 插件用户文档
  admin/              # 服务端手册 - 部署和运维文档
  changelog/          # 更新日志（由脚本自动生成）
  whitepaper/         # 产品白皮书
scripts/
  generate-changelog.js  # 从 release-manifest.json 生成 changelog
  auto-update-docs.mjs   # AI（DeepSeek）分析提交，自动更新三件套
  screenshot-docs.cjs    # Web 页面自动截图 + WPS 截图指引
  export-pdf.cjs         # 动态扫描目录，合并导出为 PDF
  download-images.sh     # 批量下载文档中的远程图片
  export-word.sh         # Word 导出
public/
  downloads/          # 导出的 PDF 文件
  icons/              # 首页功能图标 SVG
  videos/             # 产品演示视频
index.md              # 网站首页
```

## 关键工作流

- **AI 自动更新**：`repository_dispatch` 触发 → DeepSeek 分析 commit → 生成 changelog + 手册页 + 白皮书 → 截图 → 创建分支 + PR → 飞书通知审核
- **部署**：PR 合并到 main 触发 GitHub Actions → changelog → build → PDF 导出 → 部署 GitHub Pages → 飞书通知
- **手动维护**：编辑 `cove/` 下 Markdown，每个文件有 YAML frontmatter 定义 title

## 注意事项

- 网站 base path 为 `/product-manual/`（GitHub Pages 项目站点路径规则）
- 侧边栏 build 时自动扫描 `cove/client/` 和 `cove/admin/`，03-*.md 归入"功能详解"分组
- PDF 导出依赖 Puppeteer + Chrome，macOS 需要 `/Applications/Google Chrome.app`
- `.gitignore` 排除了 `videos/` 目录
