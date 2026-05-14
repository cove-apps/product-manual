/**
 * 自动分析 cove-wps / cove-go 代码变更，更新对应文档内容。
 *
 * 环境变量：
 *   DEEPSEEK_API_KEY  - DeepSeek API 密钥
 *   SOURCE_REPO       - 源仓库名（cove-wps / cove-go）
 *   SOURCE_VERSION    - 版本号或 commit hash
 */

import { execSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const SOURCE_REPO = process.env.SOURCE_REPO;
const SOURCE_VERSION = process.env.SOURCE_VERSION;

async function main() {
  if (!DEEPSEEK_API_KEY) {
    console.log("未配置 DEEPSEEK_API_KEY，跳过自动文档更新");
    return;
  }
  if (!SOURCE_REPO) {
    console.log("未指定源仓库，跳过自动文档更新");
    return;
  }

  console.log(`\n=== 自动文档更新：${SOURCE_REPO} ${SOURCE_VERSION || ""} ===\n`);

  const commits = await getCommits(SOURCE_REPO);
  if (commits.length === 0) {
    console.log("没有新提交，跳过文档更新");
    return;
  }

  console.log(`获取到 ${commits.length} 个提交`);

  const docsContext = readDocsContext();
  const updates = await analyzeChanges(commits, docsContext);

  if (updates.length === 0) {
    console.log("AI 判定无需更新文档");
    return;
  }

  for (const update of updates) {
    applyUpdate(update);
  }

  console.log("\n=== 文档更新完成 ===\n");
}

/** 获取源仓库的最近提交 */
async function getCommits(repo) {
  const repoPath = `../${repo}`;

  try {
    const log = execSync(`git -C "${repoPath}" log --oneline -10 2>/dev/null`, {
      encoding: "utf-8",
      timeout: 30000,
    }).trim();
    if (!log) return await getCommitsFromAPI(repo);

    const lines = log.split("\n").filter(Boolean);
    const commits = [];

    for (const line of lines.slice(0, 5)) {
      const [hash, ...msgParts] = line.split(" ");
      const message = msgParts.join(" ");
      let diff = "";
      try {
        diff = execSync(`git -C "${repoPath}" show --stat ${hash} 2>/dev/null | head -30`, {
          encoding: "utf-8",
          timeout: 15000,
        }).trim();
      } catch {}
      commits.push({ hash, message, diff });
    }

    return commits;
  } catch {
    return await getCommitsFromAPI(repo);
  }
}

/** 从 GitHub API 获取提交（当本地没有仓库时） */
async function getCommitsFromAPI(repo) {
  try {
    const res = await fetch(
      `https://api.github.com/repos/cove-apps/${repo}/commits?per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN || ""}`,
          "User-Agent": "product-manual-auto-update",
        },
      }
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.map((c) => ({
      hash: c.sha.slice(0, 7),
      message: c.commit.message.split("\n")[0],
      diff: c.commit.message,
    }));
  } catch {
    return [];
  }
}

/** 读取当前产品手册的关键文档 */
function readDocsContext() {
  const docsDir = join(__dirname, "..", "cove");
  const context = {};

  const indexFiles = ["client/index.md", "admin/index.md", "whitepaper/index.md"];

  for (const file of indexFiles) {
    const p = join(docsDir, file);
    if (existsSync(p)) {
      context[file] = readFileSync(p, "utf-8").slice(0, 2000);
    }
  }

  const changelogPath = join(docsDir, "changelog", "index.md");
  if (existsSync(changelogPath)) {
    const content = readFileSync(changelogPath, "utf-8");
    context["changelog/index.md"] = content.split("\n").slice(0, 50).join("\n");
  }

  return context;
}

/** 调用 DeepSeek API 分析变更 */
async function analyzeChanges(commits, docsContext) {
  const commitSummary = commits
    .map((c) => `- ${c.hash} ${c.message}\n  改动文件：${c.diff || "无"}`)
    .join("\n");

  const docsOverview = Object.entries(docsContext)
    .map(([file, content]) => `【${file}】\n${content}`)
    .join("\n\n");

  const prompt = `你是一个产品文档工程师。请分析以下代码仓库的提交，更新产品手册。

## 当前提交
${commitSummary}

## 现有文档概览
${docsOverview}

## 任务
1. 分析这些提交是否涉及用户可见的功能变化（新增功能、UI 变更、配置变更等）
2. 如果只是重构、bug 修复、技术债务清理，不需要更新文档
3. 如果涉及功能变化，请：
   a. 判断需要更新哪个文档（客户端手册 client/、服务端手册 admin/、changelog）
   b. 给出更新的具体内容
   c. 如果是 changelog，格式为 "- 功能说明 [#commit-hash]"

请用以下 JSON 格式输出（只输出 JSON，不要其他内容）：
{"needsUpdate": true/false, "reason": "简短判断原因", "updates": [{"file": "cove/changelog/index.md", "action": "insert", "content": "要插入的内容"}]}

如果不需要更新文档，设 needsUpdate: false。`;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是产品文档工程师，负责分析代码变更并更新产品手册。你只输出 JSON。" },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("AI 返回格式异常，跳过：", content.slice(0, 200));
      return [];
    }

    const result = JSON.parse(jsonMatch[0]);
    if (!result.needsUpdate) {
      console.log(`AI 判定无需更新：${result.reason}`);
      return [];
    }

    console.log(`AI 判定需要更新：${result.reason}`);
    return result.updates || [];
  } catch (err) {
    console.error("调用 DeepSeek API 出错：", err.message);
    return [];
  }
}

/** 应用文档更新 */
function applyUpdate(update) {
  const filePath = join(__dirname, "..", update.file);

  if (!existsSync(filePath)) {
    console.log(`文件不存在，跳过：${update.file}`);
    return;
  }

  if (update.action === "insert") {
    const content = readFileSync(filePath, "utf-8");
    writeFileSync(filePath, content + "\n" + update.content + "\n");
    console.log(`已追加内容到：${update.file}`);
  } else if (update.action === "modify") {
    writeFileSync(filePath, update.content + "\n");
    console.log(`已更新文件：${update.file}`);
  }
}

main().catch((err) => {
  console.error("自动文档更新失败：", err.message);
  process.exit(0);
});
