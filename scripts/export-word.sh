#!/bin/bash
# Word 文档导出脚本
# 用法: bash scripts/export-word.sh [--product cove]
#
# 依赖: pandoc（需提前安装: brew install pandoc）
# 模板: docs/template.docx（自定义 Word 模板）

set -e

PRODUCT="${1:-cove}"
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
OUTPUT_DIR="$BASE_DIR/products/$PRODUCT/downloads"
TEMPLATE="$BASE_DIR/template/template.docx"

mkdir -p "$OUTPUT_DIR"

# 检查 pandoc
if ! command -v pandoc &> /dev/null; then
  echo "❌ 请先安装 pandoc: brew install pandoc"
  exit 1
fi

# 检查模板
if [ ! -f "$TEMPLATE" ]; then
  echo "⚠️ 未找到 Word 模板，使用 pandoc 默认样式"
  TEMPLATE=""
fi

TEMPLATE_OPT=""
[ -n "$TEMPLATE" ] && TEMPLATE_OPT="--reference-doc=$TEMPLATE"

# 导出客户端手册
echo "📖 导出客户端手册..."
pandoc "$BASE_DIR/products/$PRODUCT/client/index.md" \
  $TEMPLATE_OPT \
  -o "$OUTPUT_DIR/$PRODUCT-客户端操作手册.docx"

# 导出服务端手册
echo "🔧 导出服务端手册..."
pandoc "$BASE_DIR/products/$PRODUCT/admin/index.md" \
  $TEMPLATE_OPT \
  -o "$OUTPUT_DIR/$PRODUCT-服务端部署手册.docx"

echo "✅ Word 文档已导出到: $OUTPUT_DIR"
