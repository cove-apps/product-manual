/**
 * FAQ 汇总页面生成器
 *
 * 扫描 cove/ 下所有 .md 文件，提取包含 FAQ 内容的页面，
 * 输出结构化 JSON 数据 + 组件化页面。
 *
 * 自动检测条件：
 * - 文件包含「# 常见问题」或「## 常见问题」标题
 * - 文件包含「**Q：」问答模式
 *
 * 每次构建（npm run build/dev）前自动执行，确保汇总页始终同步最新内容。
 */
const fs = require('fs')
const path = require('path')
const MarkdownIt = require('markdown-it')

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
})

const ROOT = path.resolve(__dirname, '..')
const COVE_DIR = path.join(ROOT, 'cove')
const PUBLIC_DIR = path.join(ROOT, 'public')
const OUTPUT_DIR = path.join(COVE_DIR, 'faq')
const OUTPUT_MD = path.join(OUTPUT_DIR, 'index.md')
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'faq-data.json')

// 源目录 → 显示名称映射
const LABEL_MAP = { client: '客户端', admin: '服务端' }
const SORT_ORDER = { client: 1, admin: 2 }

function getMdFiles(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      if (entry.name === 'faq' || entry.name === 'node_modules') continue
      result.push(...getMdFiles(fp))
    } else if (entry.name.endsWith('.md')) {
      result.push(fp)
    }
  }
  return result.sort()
}

function sourceLabel(fp) {
  const rel = path.relative(COVE_DIR, fp)
  const dir = rel.split(path.sep)[0]
  return LABEL_MAP[dir] || dir
}

function sourceDir(fp) {
  return path.relative(COVE_DIR, fp).split(path.sep)[0]
}

function parsePageTitle(content) {
  const m = content.match(/^title:\s*(.+)/m)
  return m ? m[1].trim() : ''
}

/**
 * 提取 FAQ 内容段落
 */
function extractSections(content) {
  const body = content.replace(/^---[\s\S]*?---\n*/, '')
  const lines = body.split('\n')
  const sections = []
  let current = null
  let faqSection = false

  for (const line of lines) {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      if (line.replace('# ', '').trim() === '常见问题') {
        faqSection = true
      }
      continue
    }

    if (line.startsWith('## ')) {
      const header = line.replace('## ', '').trim()
      if (header === '常见问题') {
        faqSection = true
        continue
      }
      if (faqSection) {
        if (current) sections.push(current)
        current = { title: header, lines: [] }
        continue
      }
      continue
    }

    if (faqSection && current) {
      current.lines.push(line)
    }
  }
  if (current) sections.push(current)
  if (sections.length === 0 && !faqSection) return []
  return sections
}

/**
 * 将 markdown 内容转为 HTML，并重写图片路径
 * 图片路径使用相对路径（相对于 faq/ 目录）
 */
function mdToHtml(content, sdir) {
  // 先重写图片路径：./images/ → ../sdir/images/
  const withFixedPaths = content.replace(/\]\(\s*\.?\/?images\//g, `](../${sdir}/images/`)
  return md.render(withFixedPaths)
}

/**
 * 复制 FAQ 图片到 public/ 目录，确保构建后图片可访问
 */
function copyImagesToPublic(sdir) {
  const srcDir = path.join(COVE_DIR, sdir, 'images')
  const destDir = path.join(PUBLIC_DIR, sdir, 'images')
  if (!fs.existsSync(srcDir)) return
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  let count = 0
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.join(srcDir, file)
    const destFile = path.join(destDir, file)
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, destFile)
      count++
    }
  }
  if (count > 0) {
    console.log(`  → 已复制 ${count} 张图片到 public/${sdir}/images/`)
  }
}

// ============================================================

// 确保输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

// 扫描所有 md 文件，识别 FAQ 来源
const sources = []
const seenDirs = new Set()

for (const fp of getMdFiles(COVE_DIR)) {
  const content = fs.readFileSync(fp, 'utf-8')
  if (!content.includes('# 常见问题') && !content.includes('**Q：')) continue

  const sections = extractSections(content)
  if (sections.length === 0) continue

  sources.push({
    file: fp,
    label: sourceLabel(fp),
    sdir: sourceDir(fp),
    title: parsePageTitle(content),
    sections,
  })
  seenDirs.add(sourceDir(fp))
}

sources.sort((a, b) => (SORT_ORDER[a.sdir] || 99) - (SORT_ORDER[b.sdir] || 99))

if (sources.length === 0) {
  console.log('⚠ FAQ 汇总：未找到任何 FAQ 内容')
  process.exit(0)
}

// 复制图片到 public/
for (const dir of seenDirs) {
  copyImagesToPublic(dir)
}

// 构建 JSON 数据
const faqItems = []
for (const src of sources) {
  for (const section of src.sections) {
    const mdContent = section.lines.join('\n').trim()
    if (!mdContent.replace(/\n/g, '').trim()) continue

    const html = mdToHtml(mdContent, src.sdir)
    faqItems.push({
      title: section.title,
      html,
      source: src.label,
      sourceDir: src.sdir,
    })
  }
}

// 写 JSON
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(faqItems, null, 2), 'utf-8')

// 写 index.md（使用 FaqTabs 组件）
const mdPage = `---
title: 常见问题汇总
---

<script setup>
import FaqTabs from '../../.vitepress/theme/components/FaqTabs.vue'
import faqData from './faq-data.json'
</script>

# 常见问题汇总

> 本文汇总了产品各模块的常见问题，内容自动同步更新。

<FaqTabs :items="faqData" />
`

fs.writeFileSync(OUTPUT_MD, mdPage, 'utf-8')

console.log(`✓ FAQ 汇总页已生成：${faqItems.length} 条问题 → ${path.relative(ROOT, OUTPUT_MD)}`)
