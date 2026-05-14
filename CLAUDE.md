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
  config.mts          # VitePress 配置：导航、侧边栏、搜索
  theme/index.ts      # 主题入口（目前只是默认主题）
cove/                  # 内容目录（产品名，可改为其他名称支持多产品）
  client/             # 客户端手册 - WPS 插件用户文档
  admin/              # 服务端手册 - 部署和运维文档
  changelog/          # 更新日志（由脚本自动生成）
  whitepaper/         # 产品白皮书
scripts/
  generate-changelog.js  # 从同级 cove-wps 仓库的 release-manifest.json 生成 changelog
  export-pdf.cjs         # 用 Puppeteer 将各手册页面合并导出为 PDF
  export-pdf.sh          # PDF 导出的 shell 包装
  download-images.sh     # 批量下载文档中的远程图片
  export-word.sh         # Word 导出
public/
  downloads/          # 导出的 PDF 文件
  icons/              # 首页图标 SVG
  videos/             # 产品演示视频
index.md              # 网站首页
```

## 关键工作流

- **更新内容**：编辑 `cove/` 下的 Markdown 文件，每个文件有 YAML frontmatter 定义 title
- **更新日志**：由 GitHub Actions 在部署时自动调用 `generate-changelog.js` 生成，数据来源是同级 `cove-wps/release-manifest.json`
- **PDF 导出**：`export-pdf.cjs` 先构建网站，启动本地 HTTP 服务，用 Puppeteer 抓取各手册页面内容，合并为单个 HTML 再生成 PDF
- **部署**：`main` 分支 push 触发 GitHub Actions → 安装依赖 → 生成 changelog → build → 导出 PDF → 部署到 GitHub Pages

## 注意事项

- 网站 base path 为 `/product-manual/`（因为 GitHub Pages 的项目站点路径规则）
- PDF 导出依赖 Puppeteer + Chrome，macOS 本地开发需要 `/Applications/Google Chrome.app` 路径
- `.gitignore` 排除了 `videos/` 目录（视频文件较大不纳入版本控制）
- `cove/` 目录名是产品标识，如果要支持多产品需要配套修改 `template/README.md` 的模板说明
