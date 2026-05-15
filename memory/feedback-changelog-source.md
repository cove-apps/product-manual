---
name: feedback-changelog-source
description: 更新日志必须严格对照 GitHub Releases 页面，不能仅看 git log
metadata:
  type: feedback
---

更新日志（changelog）必须严格从 GitHub Releases 页面获取版本记录，而不是只看 git log。

**Why:** git log 中的 tag 不一定对应正式发布的版本，commit 信息和实际 release note 也不一致。GitHub Releases 才是版本发布的权威来源。

**How to apply:** 每次检查更新时，先用 `gh release list` 获取 cove-wps 的所有 releases，对比 changelog 中已有的版本，找出缺失的版本。对每个缺失版本，用 `gh release view <tag>` 获取正式 release body，按此内容更新 changelog。
