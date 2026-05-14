/**
 * 根据 AI 分析结果，对 cove-wps 插件界面截图。
 * 在 CI 中运行，需要 cove-wps 已检出到 ../cove-wps。
 *
 * 读取 .screenshot-hints/pending.json 决定截哪些页面。
 */

const { existsSync, readFileSync, writeFileSync, mkdirSync } = require("fs");
const { join } = require("path");
const { execSync, spawn } = require("child_process");

const ROOT = join(__dirname, "..");

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
    cleanup(hintsPath);
    return;
  }

  console.log(`\n=== 开始截图：${hints.pages.length} 个页面 ===\n`);

  // ── 启动 dev server ───────────────────────────────────────────────────
  const server = await startDevServer();
  if (!server) { cleanup(hintsPath); return; }

  // ── 截图 ─────────────────────────────────────────────────────────────
  const imageDir = join(ROOT, hints.imageDir);
  mkdirSync(imageDir, { recursive: true });

  const puppeteer = require("puppeteer");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const BASE = "http://localhost:5173/cove-wps/pages";
  const taken = [];

  try {
    for (const pageName of hints.pages) {
      const url = `${BASE}/${pageName}/`;
      const filename = `${hints.label}-${pageName}.png`;
      const filepath = join(imageDir, filename);
      const relativeRef = `./images/${filename}`;

      console.log(`截图：${url}`);
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 420, height: 900 });
        await page.goto(url, { waitUntil: "networkidle0", timeout: 20000 });
        await new Promise((r) => setTimeout(r, 2000));
        await page.screenshot({ path: filepath, fullPage: true });
        await page.close();
        taken.push({ filename, ref: relativeRef });
        console.log(`  ✓ ${filename}`);
      } catch (err) {
        console.log(`  ✗ ${pageName} 截图失败：${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  // ── 追加截图引用到手冊 ────────────────────────────────────────────────
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

  // ── 清理 ─────────────────────────────────────────────────────────────
  server.kill("SIGTERM");
  cleanup(hintsPath);
  console.log(`\n=== 截图完成：${taken.length}/${hints.pages.length} ===\n`);
}

function cleanup(hintsPath) {
  try {
    execSync(`rm -rf "${join(ROOT, ".screenshot-hints")}"`);
  } catch {}
}

async function startDevServer() {
  const coveWpsDir = join(ROOT, "..", "cove-wps");
  if (!existsSync(join(coveWpsDir, "package.json"))) {
    console.log("cove-wps 目录不存在，跳过截图");
    return null;
  }

  // 安装依赖
  if (!existsSync(join(coveWpsDir, "node_modules"))) {
    console.log("安装 cove-wps 依赖...");
    try {
      execSync("npm ci", { cwd: coveWpsDir, timeout: 180000, stdio: "pipe" });
    } catch (err) {
      console.log("依赖安装失败：", err.message);
      return null;
    }
  }

  // 启动 Vite
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

main().catch((err) => {
  console.error("截图失败：", err.message);
  process.exit(0);
});
