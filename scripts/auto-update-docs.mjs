/**
 * 自动分析源仓库代码变更，更新产品手册。
 * 支持多仓库（cove-wps → 客户端手册，cove-go → 服务端手册）
 * 每个仓库更新：changelog + 操作手册 + 白皮书
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY
 *   SOURCE_REPO       - cove-wps / cove-go
 *   SOURCE_VERSION    - 版本号或 commit hash
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SOURCE_REPO = process.env.SOURCE_REPO;
const SOURCE_VERSION = process.env.SOURCE_VERSION || "";

// Repo → 文档映射
const REPO_CONFIG = {
  "cove-wps": {
    label: "客户端（WPS 插件）",
    type: "client",
    changelog: "cove/changelog/index.md",
    manualIndex: "cove/client/index.md",
    manualDir: "cove/client/",
    whitepaper: "cove/whitepaper/index.md",
  },
  "cove-go": {
    label: "服务端（管理后台）",
    type: "admin",
    changelog: "cove/changelog/index.md",
    manualIndex: "cove/admin/index.md",
    manualDir: "cove/admin/",
    whitepaper: "cove/whitepaper/index.md",
  },
};

async function main() {
  if (!DEEPSEEK_API_KEY || !SOURCE_REPO) {
    console.log("未配置 DEEPSEEK_API_KEY 或 SOURCE_REPO，跳过");
    return;
  }
  const config = REPO_CONFIG[SOURCE_REPO];
  if (!config) {
    console.log(`未知仓库：${SOURCE_REPO}，跳过`);
    return;
  }
  console.log(`\n=== 自动文档更新：${SOURCE_REPO}（${config.label}）${SOURCE_VERSION} ===\n`);

  const commits = await getCommits(SOURCE_REPO);
  if (commits.length === 0) { console.log("没有新提交，跳过"); return; }
  console.log(`获取到 ${commits.length} 个提交`);

  const docsContext = readDocsContext(config);
  console.log(`已读取 ${Object.keys(docsContext).length} 个相关文档`);

  const result = await analyzeChanges(commits, docsContext, config);
  if (!result.needsUpdate) return;

  let changed = 0;
  // changelog 已由 generate-changelog.js 从 release-manifest.json 生成，AI 不再处理
  if (result.manualContent && result.manualFilename) { updateManual(config, result); changed++; }
  if (result.whitepaper) { updateWhitepaper(config, result.whitepaper, result.whitepaperSection); changed++; }
  if (result.screenshots?.length > 0) { saveScreenshotHints(config, result); }

  console.log(`\n=== 文档更新完成（${changed} 项变更）===\n`);

  // 保存更新摘要供部署通知使用
  const summary = {
    repo: SOURCE_REPO,
    version: SOURCE_VERSION,
    type: config.type,
    label: config.label,
    reason: result.reason || null,
    manualTitle: result.manualTitle || null,
    manualFilename: result.manualFilename || null,
    hasManual: !!(result.manualContent && result.manualFilename),
    hasWhitepaper: !!result.whitepaper,
  };
  writeFileSync('/tmp/update-summary.json', JSON.stringify(summary, null, 2));
}

// ── Git 操作 ──────────────────────────────────────────────────────────────

async function getCommits(repo) {
  // CI 环境下源仓库在 _source/ 下，本地开发在上级目录
  const paths = [`_source/${repo}`, `../${repo}`];
  for (const repoPath of paths) {
    try {
      const log = execSync(`git -C "${repoPath}" log --oneline -10 2>/dev/null`, {
        encoding: "utf-8", timeout: 30000,
      }).trim();
      if (!log) continue;
      const lines = log.split("\n").filter(Boolean);
      const commits = [];
      for (const line of lines.slice(0, 5)) {
        const [hash, ...msgParts] = line.split(" ");
        const message = msgParts.join(" ");
        let diff = "";
        try {
          diff = execSync(`git -C "${repoPath}" show --stat ${hash} 2>/dev/null | head -30`, {
            encoding: "utf-8", timeout: 15000,
          }).trim();
        } catch {}
        commits.push({ hash, message, diff });
      }
      return commits;
    } catch {}
  }
  return await getCommitsFromAPI(repo);
}

async function getCommitsFromAPI(repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/cove-apps/${repo}/commits?per_page=5`,
      { headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`, "User-Agent": "product-manual-auto-update" } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((c) => ({
      hash: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      diff: c.commit.message,
    }));
  } catch { return []; }
}

// ── 文档读取 ──────────────────────────────────────────────────────────────

function readDocsContext(config) {
  const docs = {};
  const paths = [config.changelog, config.manualIndex, config.whitepaper];
  for (const relPath of paths) {
    const fullPath = join(ROOT, relPath);
    if (!existsSync(fullPath)) continue;
    const content = readFileSync(fullPath, "utf-8");
    if (relPath === config.whitepaper) {
      // 白皮书：取前 3000 字 + 产品矩阵部分
      const matrixStart = content.indexOf("## 二、产品矩阵");
      const matrixPart = matrixStart >= 0
        ? content.slice(matrixStart, matrixStart + 2000) : "";
      docs[relPath] = content.slice(0, 3000) + "\n...\n" + matrixPart;
    } else {
      docs[relPath] = content.length > 3000 ? content.slice(0, 3000) : content;
    }
  }
  return docs;
}

// ── AI 分析 ────────────────────────────────────────────────────────────────

async function analyzeChanges(commits, docsContext, config) {
  const commitSummary = commits
    .map((c) => `- ${c.hash} ${c.message}`)
    .join("\n");

  const docsList = Object.entries(docsContext)
    .map(([file, content]) => `【${file}】\n${content}`)
    .join("\n\n---\n\n");

  // 对于左侧导航的白皮书，提取对应的产品矩阵区域
  const isClient = config.type === "client";
  const manualHint = isClient
    ? "更新客户端操作手册（cove/client/），操作步骤面向 WPS 插件用户"
    : "更新服务端手册（cove/admin/），操作步骤面向系统管理员";
  const whitepaperHint = isClient
    ? '在"└── Word 插件"区域增加一行，格式如 "│   ├── 功能 —— 说明"'
    : '在"└── 企业管理后台"区域增加一行，格式如 "    ├── 功能 —— 说明"';

  // 可自动截图的页面名（来自 screenshot-docs.cjs 的 WEB_PAGES）
  const screenshotHint = [
    'sidebar', 'settings', 'login', 'plugin',
    'skill-builder', 'snapshot-history', 'plugin-et',
  ].map(p => `"${p}"`).join(", ");

  const prompt = `分析以下提交，判断是否涉及用户可见的功能变化。

源仓库：${SOURCE_REPO}（${config.label}）

提交：
${commitSummary}

当前文档：
${docsList}

规则（按优先级）：
1. 内部/测试/CI/工具链改动 → 不更新（needsUpdate: false）
2. Bug 修复 / 性能优化 → **只更新 changelog**
3. 新增功能 / 用户可见变化 → 更新 changelog + 手册 + 白皮书

输出严格 JSON（不要其他内容，字段值为 null 表示不更新该项）：

// 示例：bug 修复/优化（只更新 changelog）
{
  "needsUpdate": true,
  "reason": "修复了 XX bug",
  "changelog": "## ${SOURCE_VERSION}\n\n> 发布日期：${new Date().toISOString().slice(0, 10)}\n\n- 🐛 修复：XX 问题描述",
  "manualFilename": null,
  "manualTitle": null,
  "manualContent": null,
  "manualIndexLink": null,
  "whitepaper": null,
  "whitepaperSection": null,
  "screenshots": []
}

// 示例：新功能（更新全部）
{
  "needsUpdate": true,
  "reason": "新增了 XX 功能",
  "changelog": "## ${SOURCE_VERSION}\n\n> 发布日期：${new Date().toISOString().slice(0, 10)}\n\n- ✨ 新增：功能说明",
  "manualFilename": "${isClient ? "03-09-新功能名" : "10-新功能名"}",
  "manualTitle": "页面标题",
  "manualContent": "## 标题\\n\\n操作步骤：\\n1. 第一步\\n2. 第二步",
  "manualIndexLink": "- [**标题**](./03-09-新功能名) — 说明",
  "whitepaper": "新功能 —— 价值点（只写内容，脚本会自动加缩进）",
  "whitepaperSection": "Word 插件/企业管理后台",
  "screenshots": ["sidebar"],  // 可选值: ${screenshotHint}
}

内部改动时只输出：{"needsUpdate": false, "reason": "原因"}`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是产品文档工程师。你只输出 JSON。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) { console.log("AI 返回异常：", content.slice(0, 200)); return { needsUpdate: false }; }

    const result = JSON.parse(jsonMatch[0]);
    if (!result.needsUpdate) { console.log(`无需更新：${result.reason || "AI 判定无需更新"}`); return { needsUpdate: false }; }

    console.log(`需要更新：${result.reason}`);
    return result;
  } catch (err) {
    console.error("DeepSeek API 错误：", err.message);
    return { needsUpdate: false };
  }
}

// ── 文档更新 ──────────────────────────────────────────────────────────────

function prependToChangelog(relPath, entry, version) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  let content = readFileSync(fullPath, "utf-8");
  entry = entry.trim() + "\n";

  if (entry.startsWith("## ")) {
    // 新版本块：插入在第一个版本号前
    const m = content.match(/^(## \d+\.\d+\.\d+.*)$/m);
    if (m) { content = content.slice(0, m.index) + entry + "\n" + content.slice(m.index); }
  } else if (version) {
    // AI 未生成版本头时自动创建新版本块
    const header = `## ${version}\n\n> 发布日期：${new Date().toISOString().slice(0, 10)}\n\n`;
    const m = content.match(/^(## \d+\.\d+\.\d+.*)$/m);
    if (m) { content = content.slice(0, m.index) + header + entry + "\n" + content.slice(m.index); }
  } else {
    // 保底：插入在第一个发布日期后（极少发生）
    const m = content.match(/^(> 发布日期：.*)$/m);
    if (m) {
      const pos = m.index + m[0].length;
      content = content.slice(0, pos) + "\n\n" + entry + content.slice(pos);
    }
  }
  writeFileSync(fullPath, content);
  console.log("✓ changelog 已更新");
}

function updateManual(config, result) {
  const filePath = join(ROOT, config.manualDir, `${result.manualFilename}.md`);
  let content = result.manualContent.trim();
  if (!content.startsWith("---")) {
    content = `---\ntitle: ${result.manualTitle || result.manualFilename}\n---\n\n${content}`;
  }
  if (!content.endsWith("\n")) content += "\n";

  const isNew = !existsSync(filePath);
  writeFileSync(filePath, content);
  console.log(`✓ ${isNew ? "新建" : "更新"}手册页：${result.manualFilename}.md`);

  if (isNew && result.manualIndexLink) {
    addIndexLink(config.manualIndex, result.manualIndexLink);
  }
}

function addIndexLink(relPath, link) {
  const fullPath = join(ROOT, relPath);
  if (!existsSync(fullPath)) return;
  let content = readFileSync(fullPath, "utf-8");
  const m = content.match(/- \[.*常见问题.*\]\(.*\)/);
  if (m) {
    content = content.slice(0, m.index) + link + "\n" + content.slice(m.index);
    writeFileSync(fullPath, content);
    console.log("✓ 手册索引页已更新");
  }
}

function updateWhitepaper(config, line, section) {
  const fullPath = join(ROOT, config.whitepaper);
  if (!existsSync(fullPath)) return;
  let content = readFileSync(fullPath, "utf-8");
  line = line.trim();

  // 根据区域选择插入标记
  const isWordPlugin = (section || "").includes("Word") || config.type === "client";
  const markers = isWordPlugin
    ? ["│   └── Skill", "│   └── 技能", "│   └── 小工具"]
    : ["    └── 仪表盘", "    └── 活跃用户"];

  const prefix = isWordPlugin ? "│   ├── " : "    ├── ";

  for (const marker of markers) {
    const idx = content.indexOf(`\n${marker}`);
    if (idx >= 0) {
      content = content.slice(0, idx + 1) + prefix + line + "\n" + content.slice(idx + 1);
      writeFileSync(fullPath, content);
      console.log(`✓ 白皮书产品矩阵已更新（${isWordPlugin ? "Word插件" : "管理后台"}）`);
      return;
    }
  }
  console.log("⚠ 未找到白皮书插入位置");
}

// ── 截图提示 ──────────────────────────────────────────────────────────────

function saveScreenshotHints(config, result) {
  const hintsDir = join(ROOT, ".screenshot-hints");
  mkdirSync(hintsDir, { recursive: true });
  const hints = {
    repo: SOURCE_REPO,
    type: config.type,
    label: (result.manualTitle || result.reason || "").replace(/\s+/g, "-").slice(0, 30),
    pages: result.screenshots || [],
    imageDir: config.type === "client" ? "cove/client/images" : "cove/admin/images",
    manualFilename: result.manualFilename || "",
  };
  writeFileSync(join(hintsDir, "pending.json"), JSON.stringify(hints, null, 2));
  console.log(`📷 截图提示已保存：${hints.pages.length} 个页面（${hints.pages.join(", ")}）`);
}

main().catch((err) => {
  console.error("自动文档更新失败：", err.message);
  process.exit(0);
});
