# 多产品复用说明

本框架支持为多个产品生成独立的产品手册。每个产品只需在 `products/` 目录下创建一个文件夹。

## 快速开始一个新产品

```bash
# 1. 复制模板
cp -r template/ products/your-product

# 2. 编辑配置文件，修改产品名
# 编辑 .vitepress/config.mts

# 3. 填写内容
# products/your-product/client/   — 客户端手册
# products/your-product/admin/    — 服务端手册
# products/your-product/whitepaper/ — 产品白皮书
# products/your-product/changelog/ — 更新日志

# 4. 替换图片
# products/your-product/client/images/
# products/your-product/admin/images/

# 5. 构建发布
npm run build
```

## 目录结构说明

```
products/
└── your-product/
    ├── client/           # 客户端手册（给终端用户）
    │   ├── index.md       ← 目录页
    │   ├── 01-安装与登录.md
    │   ├── 02-界面速览.md
    │   ├── 03-XX功能.md
    │   ├── ...
    │   └── images/        ← 截图文件
    │
    ├── admin/            # 服务端手册（给管理员）
    │   ├── index.md
    │   ├── 01-环境准备.md
    │   └── ...
    │
    ├── whitepaper/       # 产品白皮书
    │   └── index.md
    │
    ├── changelog/        # 更新日志
    │   └── index.md
    │
    └── downloads/        # Word 文档等资源
```

## 可定制项

| 项目 | 修改位置 |
|------|---------|
| 网站名称 | `.vitepress/config.mts` 中的 `title` |
| 导航栏 | `.vitepress/config.mts` 中的 `nav` |
| 侧边栏 | `.vitepress/config.mts` 中的 `sidebar` |
| 品牌图标 | `public/favicon.svg` |
| 首页内容 | `index.md` |
| Word 模板 | `template/template.docx` |
