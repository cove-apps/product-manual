#!/bin/bash
# PDF 文档导出脚本
# 生成客户端手册、服务端手册、产品白皮书的 PDF
#
# 用法: bash scripts/export-pdf.sh
# 依赖: pandoc + wkhtmltopdf，或 pandoc + LaTeX

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONTENT_DIR="$SCRIPT_DIR"
OUTPUT_DIR="$SCRIPT_DIR/public/downloads"
mkdir -p "$OUTPUT_DIR"

# 检测可用的 PDF 引擎
if command -v wkhtmltopdf &> /dev/null; then
  PDF_ENGINE="wkhtmltopdf"
elif command -v xelatex &> /dev/null; then
  PDF_ENGINE="xelatex"
elif command -v pdflatex &> /dev/null; then
  PDF_ENGINE="pdflatex"
else
  echo "⚠️ 未找到 PDF 引擎，尝试用 pandoc 的 html 输出+" >&2
  echo "   建议安装: brew install wkhtmltopdf" >&2
  echo "   或在 CI 中: apt-get install pandoc texlive-latex-base" >&2
  PDF_ENGINE="none"
fi

echo "📄 PDF 引擎: $PDF_ENGINE"

# 生成 PDF 函数
generate_pdf() {
  local title="$1"
  local output_file="$2"
  shift 2
  local input_files=("$@")

  echo "📖 生成: $title → $output_file.pdf"

  # 创建临时 markdown 文件
  local tmp_md="$OUTPUT_DIR/_tmp_${title}.md"

  # 写入标题和目录
  echo "---" > "$tmp_md"
  echo "title: \"$title\"" >> "$tmp_md"
  echo "---" >> "$tmp_md"
  echo "" >> "$tmp_md"
  echo "# $title" >> "$tmp_md"
  echo "" >> "$tmp_md"

  # 合并所有输入文件
  for f in "${input_files[@]}"; do
    if [ -f "$f" ]; then
      # 跳过 frontmatter 和已有的一级标题
      cat "$f" | sed '1{/^---$/d}' | sed '/^---$/,/^---$/d' >> "$tmp_md"
      echo "" >> "$tmp_md"
      echo "---" >> "$tmp_md"
      echo "" >> "$tmp_md"
    fi
  done

  # 转换为 PDF
  if [ "$PDF_ENGINE" = "none" ]; then
    # 降级为 HTML，后面再用 puppeteer 转 PDF
    pandoc "$tmp_md" -o "$OUTPUT_DIR/${output_file}.html" --self-contained -c "$SCRIPT_DIR/scripts/pdf-style.css"
    echo "  → 已生成 HTML: ${output_file}.html"
  else
    pandoc "$tmp_md" -o "$OUTPUT_DIR/${output_file}.pdf" \
      --pdf-engine="$PDF_ENGINE" \
      -V mainfont="Heiti SC" \
      -V documentclass=article \
      -V geometry:margin=2cm
    echo "  → 已生成 PDF: ${output_file}.pdf"
  fi

  rm -f "$tmp_md"
}

echo ""
echo "========== 开始导出 PDF =========="
echo ""

# 客户端手册
generate_pdf "Cove 客户端操作手册" "cove-客户端手册" \
  "$CONTENT_DIR/cove/client/index.md" \
  "$CONTENT_DIR/cove/client/01-安装与登录.md" \
  "$CONTENT_DIR/cove/client/02-界面速览.md" \
  "$CONTENT_DIR/cove/client/03-01-校对.md" \
  "$CONTENT_DIR/cove/client/03-02-排版.md" \
  "$CONTENT_DIR/cove/client/03-03-校审.md" \
  "$CONTENT_DIR/cove/client/03-04-翻译.md" \
  "$CONTENT_DIR/cove/client/03-05-总结.md" \
  "$CONTENT_DIR/cove/client/03-06-改写.md" \
  "$CONTENT_DIR/cove/client/03-07-润色.md" \
  "$CONTENT_DIR/cove/client/03-08-小工具.md" \
  "$CONTENT_DIR/cove/client/04-常见问题.md"

# 服务端手册
generate_pdf "Cove 服务端部署及管理后台手册" "cove-服务端手册" \
  "$CONTENT_DIR/cove/admin/index.md" \
  "$CONTENT_DIR/cove/admin/01-环境准备.md" \
  "$CONTENT_DIR/cove/admin/02-服务端部署.md" \
  "$CONTENT_DIR/cove/admin/03-大模型配置.md" \
  "$CONTENT_DIR/cove/admin/04-用户管理.md" \
  "$CONTENT_DIR/cove/admin/05-任务与指令.md" \
  "$CONTENT_DIR/cove/admin/06-技能库.md" \
  "$CONTENT_DIR/cove/admin/07-安全配置.md" \
  "$CONTENT_DIR/cove/admin/08-仪表盘.md" \
  "$CONTENT_DIR/cove/admin/09-常见问题.md"

# 产品白皮书
generate_pdf "Cove 产品白皮书" "cove-产品白皮书" \
  "$CONTENT_DIR/cove/whitepaper/index.md"

# 更新日志
generate_pdf "Cove 更新日志" "cove-更新日志" \
  "$CONTENT_DIR/cove/changelog/index.md"

echo ""
echo "========== PDF 导出完成 =========="
ls -lh "$OUTPUT_DIR"/*.pdf 2>/dev/null || ls -lh "$OUTPUT_DIR"/*.html 2>/dev/null
