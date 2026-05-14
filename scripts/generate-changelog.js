/**
 * 更新日志生成脚本
 *
 * 用法: node scripts/generate-changelog.js [--repo ../cove-wps]
 *
 * 从 cove-wps 仓库的 release-manifest.json 读取更新日志，
 * 生成 VitePress 兼容的 Markdown 页面。
 */

const fs = require('fs');
const path = require('path');

// 默认路径：假设 cove-wps 和 product-manual 在同级目录
const DEFAULT_REPO_PATH = path.resolve(__dirname, '../../cove-wps');
const OUTPUT_PATH = path.resolve(__dirname, '../cove/changelog/index.md');

const repoPath = process.argv.find(a => a.startsWith('--repo='))?.split('=')[1] || process.env.COVE_WPS_PATH || DEFAULT_REPO_PATH;

function generate() {
  const manifestPath = path.join(repoPath, 'release-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('未找到 release-manifest.json，请指定正确路径：');
    console.error(`  node scripts/generate-changelog.js --repo ../cove-wps`);
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const changelog = manifest.changelog || [];

  if (changelog.length === 0) {
    console.log('更新日志为空，跳过生成。');
    return;
  }

  const lines = [
    '---',
    'title: 更新日志',
    '---',
    '',
    '# 更新日志',
    '',
    '> 每次版本更新后，你可以在这里查看新增了什么、修复了什么。',
    '',
    '<div style="margin:20px 0;">',
    '  <a target="_blank" href="/product-manual/downloads/OfficeAI-更新日志.pdf" style="display:inline-block;padding:10px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:500;">',
    '    ⬇ 下载 PDF 版本',
    '  </a>',
    '</div>',
    '',
  ];

  for (const entry of changelog) {
    lines.push(`## ${entry.version}`, '', `> 发布日期：${entry.date}`, '');

    for (const item of entry.items) {
      // 按类型添加图标
      let icon = '';
      if (item.startsWith('新增')) icon = '✨ ';
      else if (item.startsWith('优化')) icon = '⚡ ';
      else if (item.startsWith('修复')) icon = '🐛 ';
      // 转义 HTML 标签，避免 VitePress 解析错误
      const safeItem = item.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      lines.push(`- ${icon}${safeItem}`);
    }

    lines.push('');
  }

  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'), 'utf-8');
  console.log(`✅ 更新日志已生成: ${OUTPUT_PATH}`);
  console.log(`   共 ${changelog.length} 个版本`);
}

generate();
