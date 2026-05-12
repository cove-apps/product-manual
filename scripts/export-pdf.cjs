/**
导出脚本：将所有手册页面合并为一个 HTML → 一次生成 PDF → 获得完整目录大纲。
用法：node scripts/export-pdf.cjs （需先 npm run build）
*/

const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '../.vitepress/dist');
const OUTPUT = path.resolve(__dirname, '../public/downloads');
const PORT = 8765;
const BASE = `http://localhost:${PORT}`;

const SECTIONS = [
  {
    name: 'cove-客户端手册',
    pages: [
      '/cove/client/', '/cove/client/01-安装与登录', '/cove/client/02-界面速览',
      '/cove/client/03-01-校对', '/cove/client/03-02-排版', '/cove/client/03-03-校审',
      '/cove/client/03-04-翻译', '/cove/client/03-05-总结', '/cove/client/03-06-改写',
      '/cove/client/03-07-润色', '/cove/client/03-08-小工具', '/cove/client/04-常见问题',
    ],
  },
  {
    name: 'cove-服务端手册',
    pages: [
      '/cove/admin/', '/cove/admin/01-环境准备', '/cove/admin/02-服务端部署',
      '/cove/admin/03-大模型配置', '/cove/admin/04-用户管理', '/cove/admin/05-任务与指令',
      '/cove/admin/06-技能库', '/cove/admin/07-安全配置', '/cove/admin/08-仪表盘',
      '/cove/admin/09-常见问题',
    ],
  },
  {
    name: 'cove-产品白皮书',
    pages: ['/cove/whitepaper/'],
  },
  {
    name: 'cove-更新日志',
    pages: ['/cove/changelog/'],
  },
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
      const url = decodeURIComponent(req.url);
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

/** 抓取单个页面的 HTML 正文内容 */
async function fetchPageContent(browser, url) {
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  // 等待所有图片完成
  await page.evaluate(() => Promise.all(
    Array.from(document.querySelectorAll('img'))
      .filter(img => !img.complete)
      .map(img => new Promise(r => { img.onload = r; img.onerror = r; }))
  ));
  await new Promise(r => setTimeout(r, 2000));
  // 获取正文 HTML（去除导航、侧边栏、页脚、视频、下载按钮）
  const html = await page.evaluate(() => {
    // 移除页面装饰元素
    document.querySelectorAll('video,.VPNav,.VPSidebar,.VPLocalNav,.VPFooter,.VPDocFooter,a[href*="/downloads/"]')
      .forEach(el => el.remove());
    // 内部链接转纯文本
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

  fs.mkdirSync(OUTPUT, { recursive: true });

  for (const section of SECTIONS) {
    console.log(`\n📖 ${section.name}`);

    // 1. 逐个页面抓取正文
    const contents = [];
    for (const pageUrl of section.pages) {
      process.stdout.write(`  抓取: ${pageUrl} `);
      const html = await fetchPageContent(browser, `${BASE}${pageUrl}`);
      contents.push(html);
      process.stdout.write(`(${(html.length / 1024).toFixed(0)}KB)\n`);
    }

    // 2. 组装为单个完整 HTML
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

    // 3. 保存临时 HTML 到 dist 内（让 HTTP 服务器可访问）
    const tmpFile = path.join(DIST, `_combined_${section.name}.html`);
    fs.writeFileSync(tmpFile, combinedHtml, 'utf-8');

    // 生成 PDF
    const pdfPage = await browser.newPage();
    await pdfPage.goto(`http://localhost:${PORT}/_combined_${section.name}.html`, {
      waitUntil: 'networkidle0', timeout: 30000
    });
    await new Promise(r => setTimeout(r, 3000));

    const pdfPath = path.join(OUTPUT, `${section.name}.pdf`);
    await pdfPage.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      outline: true,
      tagged: true,
      margin: { top: '1.5cm', bottom: '1.5cm', left: '2cm', right: '2cm' },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="width:100%;font-size:9px;text-align:center;color:#999;padding:5px 20px;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>`,
    });
    await pdfPage.close();
    try { fs.unlinkSync(tmpFile); } catch(e) {}

    const size = (fs.statSync(pdfPath).size / 1024 / 1024).toFixed(1);
    console.log(`  ✅ ${section.name}.pdf (${size}MB)`);
  }

  await browser.close();
  server.close();
  console.log('\n✅ 全部 PDF 生成完成');
}

main().catch(err => { console.error('❌', err); process.exit(1); });
