/**
 * 产品手册截图脚本
 *
 * 策略（WPS 插件的界面只能在 WPS 内截取，本脚本采用混合方案）：
 * 1. 可 Web 渲染的页面（sidebar/settings/plugin 等）→ Playwright 自动截图
 * 2. 需要 WPS 上下文的截图 → 生成手动截图指引，通过飞书通知
 *
 * 读取 .screenshot-hints/pending.json 决定截哪些页面。
 */

const { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } = require("fs");
const { join } = require("path");
const { execSync, spawn } = require("child_process");

const ROOT = join(__dirname, "..");

// cove-wps 中可以 Web 渲染的页面路由
// key: AI 输出的 page name, value: { url, desc }
const WEB_PAGES = {
  "sidebar":         { url: "/cove-wps/pages/sidebar/",         desc: "侧边栏主界面" },
  "settings":        { url: "/cove-wps/pages/settings/",        desc: "设置页面" },
  "login":           { url: "/cove-wps/pages/login/",           desc: "登录页面" },
  "plugin":          { url: "/cove-wps/pages/plugin/",          desc: "插件主页面" },
  "skill-builder":   { url: "/cove-wps/pages/skill-builder/",   desc: "技能构建器" },
  "snapshot-history":{ url: "/cove-wps/pages/snapshot-history/", desc: "快照历史" },
  "plugin-et":       { url: "/cove-wps/pages/plugin-et/",       desc: "插件增强工具" },
};

async function main() {
  // ── 读取提示 ──────────────────────────────────────────────────────────
  const hintsPath = join(ROOT, ".screenshot-hints", "pending.json");
  if (!existsSync(hintsPath)) {
    console.log("没有待处理的截图任务，跳过");
    return;
  }

  const hints = JSON.parse(readFileSync(hintsPath, "utf-8"));
  if (!hints.pages || hints.pages.length === 0) {
    console.log("没有需要截图的页面，跳过");
    cleanup();
    return;
  }

  console.log(`\n=== 开始截图处理：${hints.pages.length} 个页面 ===\n`);

  // 分离可自动截图和需要手动截图的页面
  const autoPages = hints.pages.filter((p) => WEB_PAGES[p]);
  const manualPages = hints.pages.filter((p) => !WEB_PAGES[p]);

  if (autoPages.length > 0) {
    console.log(`可自动截图：${autoPages.join(", ")}`);
    const failed = await takeAutoScreenshots(autoPages, hints);
    // 失败的页面加入手动截图列表
    for (const p of failed) {
      if (!manualPages.includes(p)) manualPages.push(p);
    }
  }

  if (manualPages.length > 0) {
    console.log(`需要手动截图：${manualPages.join(", ")}`);
    saveManualHints(manualPages, hints);
  }

  cleanup();
  console.log(`\n=== 截图处理完成（自动 ${autoPages.length} / 手动 ${manualPages.length}）===\n`);
}

// ── 自动截图 ──────────────────────────────────────────────────────────────

async function takeAutoScreenshots(pages, hints) {
  const imageDir = join(ROOT, hints.imageDir);
  mkdirSync(imageDir, { recursive: true });
  const failed = [];

  const server = await startDevServer();
  if (!server) {
    console.log("无法启动 dev server，跳过自动截图");
    return pages; // 全部降级为手动
  }

  let puppeteer;
  try {
    puppeteer = require("puppeteer");
  } catch {
    console.log("puppeteer 不可用，降级为手动截图");
    killServer(server);
    return pages;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const taken = [];
  try {
    for (const pageName of pages) {
      const info = WEB_PAGES[pageName];
      const url = `http://localhost:5173${info.url}`;
      const filename = `${hints.label}-${pageName}.png`;
      const filepath = join(imageDir, filename);
      const relativeRef = `./images/${filename}`;

      console.log(`截图：${url}`);
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 420, height: 900 });
        await page.goto(url, { waitUntil: "networkidle0", timeout: 25000 });
        await new Promise((r) => setTimeout(r, 2000));
        await page.screenshot({ path: filepath, fullPage: true });
        await page.close();
        taken.push({ filename, ref: relativeRef, pageName });
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        console.log(`  ✗ ${pageName} 截图失败：${err.message}`);
        failed.push(pageName);
      }
    }
  } finally {
    await browser.close();
  }

  killServer(server);

  // 追加截图到手冊
  if (hints.manualFilename && taken.length > 0) {
    const manualDir = hints.type === "client" ? "cove/client" : "cove/admin";
    const manualPath = join(ROOT, manualDir, `${hints.manualFilename}.md`);
    if (existsSync(manualPath)) {
      let content = readFileSync(manualPath, "utf-8");
      content += "\n## 界面截图\n\n";
      for (const t of taken) {
        content += `![${hints.label} 界面](${t.ref})\n\n`;
      }
      writeFileSync(manualPath, content);
      console.log(`✓ 已追加 ${taken.length} 个截图引用到 ${hints.manualFilename}.md`);
    }
  }

  return failed;
}

// ── 手动截图指引 ───────────────────────────────────────────────────────

function saveManualHints(pages, hints) {
  const manualDir = join(ROOT, ".screenshot-hints");
  mkdirSync(manualDir, { recursive: true });

  const manual = {
    repo: hints.repo,
    type: hints.type,
    label: hints.label,
    feature: hints.manualFilename || "",
    manualPages: pages,
    message: `请在 WPS 中打开 ${hints.label} 相关界面，截图后放入 ${hints.imageDir}/ 目录，文件名以 ${hints.label}- 开头。`,
  };

  writeFileSync(join(manualDir, "manual.json"), JSON.stringify(manual, null, 2));
  console.log(`📷 手动截图指引已保存：${pages.length} 个页面需要人工截图`);
  console.log(`   请在 WPS 中打开以下界面截图：${pages.join(", ")}`);
}

// ── Dev Server ──────────────────────────────────────────────────────────

async function startDevServer() {
  const coveWpsDir = join(ROOT, "..", "cove-wps");
  if (!existsSync(join(coveWpsDir, "package.json"))) {
    console.log("cove-wps 目录不存在，跳过自动截图");
    return null;
  }

  if (!existsSync(join(coveWpsDir, "node_modules"))) {
    console.log("安装 cove-wps 依赖...");
    try {
      execSync("npm ci", { cwd: coveWpsDir, timeout: 180000, stdio: "pipe" });
    } catch (err) {
      console.log("依赖安装失败：", err.message);
      return null;
    }
  }

  console.log("启动 Vite dev server...");
  const server = spawn("npx", ["vite", "--port", "5173", "--host"], {
    cwd: coveWpsDir,
    stdio: "pipe",
    shell: true,
  });

  let resolved = false;
  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; console.log("dev server 启动超时，尝试继续"); resolve(); }
    }, 40000);

    const check = (data) => {
      if (!resolved && (data.toString().includes("Local:") || data.toString().includes("ready"))) {
        resolved = true;
        clearTimeout(timeout);
        setTimeout(resolve, 3000);
      }
    };
    server.stdout.on("data", check);
    server.stderr.on("data", check);
    server.on("error", () => { if (!resolved) { resolved = true; clearTimeout(timeout); resolve(); } });
    server.on("exit", () => { if (!resolved) { resolved = true; clearTimeout(timeout); resolve(null); } });
  });

  return server;
}

function killServer(server) {
  try {
    server.kill("SIGTERM");
  } catch {}
}

function cleanup() {
  try {
    const hintsPath = join(ROOT, ".screenshot-hints", "pending.json");
    if (existsSync(hintsPath)) unlinkSync(hintsPath);
  } catch {}
}

main().catch((err) => {
  console.error("截图失败：", err.message);
  process.exit(0);
});
