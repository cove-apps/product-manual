/**
 * PDF 导出脚本：动态扫描目录，自动包含新增页面。
 * 将所有手册页面合并为一个 HTML → 一次生成 PDF → 获得完整目录大纲。
 * 用法：node scripts/export-pdf.cjs （需先 npm run build）
 */

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DIST = path.resolve(ROOT, '.vitepress/dist');
const DIST_DL = path.resolve(DIST, 'downloads');   // 部署产物目录（GitHub Pages 用）
const SRC_DL = path.resolve(ROOT, 'public/downloads'); // 源文件目录（开发服务器用）
const PORT = 8765;
const BASE = `http://localhost:${PORT}`;
const BASE_PATH = '/product-manual';  // VitePress base path，文件服务时需要去掉

/**
 * 扫描目录，自动发现所有手册页面。
 * 按文件名排序，排除 index.md。
 */
function scanPages(dir, label) {
  const fullDir = path.resolve(ROOT, dir);
  if (!fs.existsSync(fullDir)) return { name: label, pages: [] };

  const files = fs.readdirSync(fullDir)
    .filter(f => f.endsWith('.md') && f !== 'index.md')
    .sort();

  const pages = files.map(f => `/${dir}/${f.replace(/\.md$/, '')}`);
  return { name: label, pages };
}

// 动态构建导出列表
const SECTIONS = [
  scanPages('cove/client', 'OfficeAI-客户端手册'),
  scanPages('cove/admin', 'OfficeAI-服务端手册'),
  { name: 'OfficeAI-产品白皮书', pages: ['/cove/whitepaper/'] },
  { name: 'OfficeAI-更新日志', pages: ['/cove/changelog/'] },
];

// 静态文件服务器
function startServer(distDir, port) {
  return new Promise((resolve) => {
    const mime = {
      '.html':'text/html','.css':'text/css','.js':'application/javascript',
      '.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml',
      '.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf',
    };
    const srv = http.createServer((req, res) => {
      let url = decodeURIComponent(req.url);
      // 去掉 VitePress base path 前缀，使路径能正确匹配 dist 目录结构
      if (url.startsWith(BASE_PATH + '/') || url === BASE_PATH) {
        url = url.slice(BASE_PATH.length) || '/';
      }
      let fp = path.join(distDir, url === '/' ? '/index.html' : url);
      if (!path.extname(fp)) {
        const withHtml = fp + '.html';
        fp = fs.existsSync(withHtml) ? withHtml : path.join(fp, 'index.html');
      }
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); res.end(''); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(fp)] || 'application/octet-stream' });
        res.end(data);
      });
    });
    srv.listen(port, () => resolve(srv));
  });
}

/** 抓取单个页面的 HTML 正文内容（DOM 就绪即可，不等图片加载） */
async function fetchPageContent(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // 获取正文 HTML（去除导航、侧边栏、页脚、视频、下载按钮）
  const html = await page.evaluate(() => {
    document.querySelectorAll('video,.VPNav,.VPSidebar,.VPLocalNav,.VPFooter,.VPDocFooter,a[href*="/downloads/"]')
      .forEach(el => el.remove());
    document.querySelectorAll('a[href]').forEach(a => {
      const h = a.getAttribute('href') || '';
      if (h.startsWith('/') || h.startsWith('./') || h.startsWith('../') || h.startsWith('#')) {
        const s = document.createElement('span');
        s.textContent = a.textContent;
        a.parentNode.replaceChild(s, a);
      }
    });
    const el = document.querySelector('.vp-doc') || document.querySelector('.VPContent') || document.body;
    return el.innerHTML;
  });
  await page.close();
  return html;
}

/** 并行抓取多页，限制并发数 */
async function fetchAllPages(browser, pages, baseUrl) {
  const results = [];
  const concurrency = 5;
  for (let i = 0; i < pages.length; i += concurrency) {
    const batch = pages.slice(i, i + concurrency);
    const batchHtml = await Promise.all(
      batch.map(url =>
        fetchPageContent(browser, `${baseUrl}${url}`).catch(err => {
          process.stdout.write(`    ⚠ ${url} 失败: ${err.message}\n`);
          return '';
        })
      )
    );
    results.push(...batchHtml);
  }
  return results;
}

async function main() {
  if (!fs.existsSync(DIST)) {
    console.error('❌ 请先运行 npm run build');
    process.exit(1);
  }

  const server = await startServer(DIST, PORT);
  console.log(`🚀 服务已启动: ${BASE}`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
  });

  fs.mkdirSync(DIST_DL, { recursive: true });
  fs.mkdirSync(SRC_DL, { recursive: true });

  for (const section of SECTIONS) {
    if (section.pages.length === 0) {
      console.log(`\n📖 ${section.name} — 无页面，跳过`);
      continue;
    }

    console.log(`\n📖 ${section.name}（${section.pages.length} 页）`);

    const contents = [];
    console.log(`  正在抓取 ${section.pages.length} 页（并发 5 组）...`);
    // 需要包含 base path 前缀，否则 VitePress JS 路由检测到路径不符会显示 404
    const htmls = await fetchAllPages(browser, section.pages, `${BASE}${BASE_PATH}`);
    for (let i = 0; i < section.pages.length; i++) {
      process.stdout.write(`  ${section.pages[i]} (${(htmls[i].length / 1024).toFixed(0)}KB)\n`);
      contents.push(htmls[i]);
    }

    const combinedHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif; font-size:14px; line-height:1.7; color:#222; max-width:210mm; margin:0 auto; padding:2cm; }
  h1 { font-size:22pt; color:#1a1a1a; border-bottom:2px solid #2563eb; padding-bottom:8pt; margin-top:28pt; }
  h2 { font-size:16pt; color:#333; margin-top:22pt; }
  h3 { font-size:13pt; color:#444; margin-top:16pt; }
  img { max-width:100%; height:auto; margin:12pt 0; display:block; }
  table { border-collapse:collapse; width:100%; margin:12pt 0; }
  th,td { border:1px solid #ccc; padding:6pt 10pt; text-align:left; }
  th { background:#f0f4ff; }
  code { background:#f5f5f5; padding:1pt 4pt; border-radius:3pt; font-size:12pt; }
  pre { background:#f5f5f5; padding:12pt; border-radius:4pt; font-size:11pt; overflow-x:auto; white-space:pre-wrap; }
  blockquote { border-left:3pt solid #2563eb; margin:10pt 0; padding:6pt 12pt; background:#f8faff; }
  hr { border:none; border-top:1pt solid #ddd; margin:20pt 0; }
  .page-break { page-break-before: always; }
  video { display:none !important; }
</style>
</head>
<body>
${contents.join('\n<div class="page-break"></div>\n')}
</body>
</html>`;

    const tmpFile = path.join(DIST, `_combined_${section.name}.html`);
    fs.writeFileSync(tmpFile, combinedHtml, 'utf-8');

    const pdfPage = await browser.newPage();
    await pdfPage.goto(`http://localhost:${PORT}/_combined_${section.name}.html`, {
      waitUntil: 'networkidle0', timeout: 30000
    });
    // PDF 页内图片需要加载完成，等网络静默
    await pdfPage.evaluate(() => Promise.all(
      Array.from(document.querySelectorAll('img'))
        .filter(img => !img.complete)
        .map(img => new Promise(r => { img.onload = r; img.onerror = r; }))
    ));

    const pdfPath = path.join(DIST_DL, `${section.name}.pdf`);
    await pdfPage.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      outline: true,
      tagged: true,
      margin: { top: '1.5cm', bottom: '1.5cm', left: '2cm', right: '2cm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',  // 覆盖默认页眉，隐藏自动日期
      footerTemplate: `
        <div style="width:100%;font-size:9px;text-align:center;color:#999;padding:5px 20px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
    });
    await pdfPage.close();
    try { fs.unlinkSync(tmpFile); } catch(e) {}

    // 同步到 public/downloads/，供开发服务器使用
    const srcPath = path.join(SRC_DL, `${section.name}.pdf`);
    fs.copyFileSync(pdfPath, srcPath);

    const size = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ ${section.name}.pdf (${size}MB)`);
  }

  await browser.close();
  server.close();
  console.log('\n✅ 全部 PDF 生成完成');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
