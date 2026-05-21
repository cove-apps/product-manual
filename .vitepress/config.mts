import { defineConfig } from 'vitepress'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const __dirname = new URL('.', import.meta.url).pathname

/**
 * 扫描目录，自动生成侧边栏。
 * 约定：
 * - index.md → 概览页（放在最前）
 * - 03-*.md → 归入"功能详解"子分组（仅客户端手册）
 * - 其他 *.md → 按文件名排序展开
 */
function scanSidebar(dir, label, hasFeatureGroup = false) {
  const fullDir = resolve(__dirname, '..', dir)
  if (!existsSync(fullDir)) return [{ text: label, items: [] }]

  const files = readdirSync(fullDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort()

  if (!hasFeatureGroup) {
    // 服务端手册：平铺列表
    const items = files.map(f => parseMdFile(dir, f))
    return [{ text: label, items: [{ text: '产品概述', link: `/${dir}/` }, ...items] }]
  }

  // 客户端手册：产品简介 + 顶部页 + 功能详解(03-*) + 常见问题
  const topItems = []
  const featureItems = []

  for (const f of files) {
    if (f.startsWith('03-')) {
      featureItems.push(parseMdFile(dir, f))
    } else {
      topItems.push(parseMdFile(dir, f))
    }
  }

  return [{
    text: label,
    items: [
      { text: '产品简介', link: `/${dir}/` },
      ...topItems,
      ...(featureItems.length > 0 ? [{ text: '功能详解', items: featureItems }] : []),
    ],
  }]
}

function parseMdFile(dir, filename) {
  const fullPath = resolve(__dirname, '..', dir, filename)
  const name = filename.replace(/\.md$/, '')
  try {
    const content = readFileSync(fullPath, 'utf-8')
    const titleMatch = content.match(/^title:\s*(.+)/m)
    return { text: titleMatch ? titleMatch[1].trim() : name, link: `/${dir}/${name}` }
  } catch {
    return { text: name, link: `/${dir}/${name}` }
  }
}

export default defineConfig({
  title: "OfficeAI 产品手册",
  description: "OfficeAI 产品说明文档",
  base: '/product-manual/',
  srcDir: '.',
  srcExclude: ['_source/**'],
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/favicon.svg' }],
  ],

  lang: 'zh-CN',

  themeConfig: {
    logo: {
      light: '/officeai-nav-logo-light.png',
      dark: '/officeai-nav-logo-dark.png',
    },
    outlineTitle: '本页内容',
    lastUpdatedText: '最后更新',
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    darkModeSwitchLabel: '深色模式',
    sidebarMenuLabel: '菜单',
    returnToTopLabel: '返回顶部',
    langMenuLabel: '切换语言',

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: '搜索文档',
            buttonAriaLabel: '搜索全部文档',
          },
          modal: {
            noResultsText: '未找到相关结果',
            resetButtonTitle: '清除搜索',
            footer: {
              selectText: '选择',
              navigateText: '切换',
              closeText: '关闭',
            },
          },
        },
      },
    },

    nav: [
      { text: 'OfficeAI 产品手册', link: '/' },
      { text: '客户端手册', link: '/cove/client/' },
      { text: '服务端手册', link: '/cove/admin/' },
      { text: '产品白皮书', link: '/cove/whitepaper/' },
      { text: '更新日志', link: '/cove/changelog/' },
      { text: '常见问题', link: '/cove/faq/' },
    ],

    sidebar: {
      '/cove/client/': scanSidebar('cove/client', '客户端手册', true),
      '/cove/admin/': scanSidebar('cove/admin', '服务端手册'),
      '/cove/changelog/': [
        { text: '更新日志', link: '/cove/changelog/' },
      ],
      '/cove/whitepaper/': [
        { text: '产品白皮书', link: '/cove/whitepaper/' },
      ],
      '/cove/faq/': [
        { text: '常见问题汇总', link: '/cove/faq/' },
      ],
    },

    footer: {
      message: '用 AI 解锁新质生产力',
      copyright: '© 2026 OfficeAI',
    },
  },
})
