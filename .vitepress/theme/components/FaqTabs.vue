<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  items: {
    title: string
    html: string
    source: string
    sourceDir: string
  }[]
}>()

const activeTab = ref<'all' | 'client' | 'admin'>('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'client', label: '客户端' },
  { key: 'admin', label: '服务端' },
] as const

// 修正图片路径：相对路径 → 带上 base 前缀的绝对路径
const base = (import.meta as any).env.BASE_URL || '/'

function fixImagePaths(html: string): string {
  return html
    .replace(/src="\.\.\/client\/images\//g, `src="${base}client/images/`)
    .replace(/src="\.\.\/admin\/images\//g, `src="${base}admin/images/`)
}

const itemsWithFixedPaths = computed(() =>
  props.items.map(item => ({ ...item, html: fixImagePaths(item.html) }))
)

const filteredItems = computed(() => {
  if (activeTab.value === 'all') return itemsWithFixedPaths.value
  return itemsWithFixedPaths.value.filter(item => item.sourceDir === activeTab.value)
})

const counted = computed(() => ({
  all: props.items.length,
  client: props.items.filter(i => i.sourceDir === 'client').length,
  admin: props.items.filter(i => i.sourceDir === 'admin').length,
}))

function setTab(key: typeof activeTab.value) {
  activeTab.value = key
}
</script>

<template>
  <div class="faq-tabs">
    <!-- 分段选择器 -->
    <div class="faq-segmented" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        :class="['faq-segmented-btn', { active: activeTab === tab.key }]"
        :aria-selected="activeTab === tab.key"
        role="tab"
        @click="setTab(tab.key)"
      >
        {{ tab.label }}
        <span class="faq-count">({{ counted[tab.key] }})</span>
      </button>
    </div>

    <!-- FAQ 列表 -->
    <div class="faq-list" role="tabpanel">
      <article
        v-for="(item, idx) in filteredItems"
        :key="idx"
        class="faq-item"
      >
        <h3 class="faq-item-title">
          {{ item.title }}
          <span
            :class="[
              'faq-badge',
              item.sourceDir === 'client' ? 'faq-badge-client' : 'faq-badge-admin',
            ]"
          >{{ item.source }}</span>
        </h3>
        <div class="faq-item-content" v-html="item.html"></div>
      </article>

      <p v-if="filteredItems.length === 0" class="faq-empty">
        暂无该分类的常见问题。
      </p>
    </div>
  </div>
</template>

<style scoped>
.faq-tabs {
  margin-top: 8px;
}

/* 分段选择器 */
.faq-segmented {
  display: inline-flex;
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--vp-c-bg-soft);
}

.faq-segmented-btn {
  padding: 7px 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
}

.faq-segmented-btn:not(:last-child)::after {
  content: '';
  position: absolute;
  right: 0;
  top: 20%;
  height: 60%;
  width: 1px;
  background: var(--vp-c-border);
}

.faq-segmented-btn.active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.faq-segmented-btn.active::after {
  display: none;
}

.faq-count {
  font-size: 12px;
  opacity: 0.7;
  margin-left: 2px;
}

.faq-segmented-btn.active .faq-count {
  opacity: 0.85;
}

/* FAQ 列表 */
.faq-list {
  margin-top: 20px;
}

.faq-item {
  padding: 28px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.faq-item:last-child {
  border-bottom: none;
}

.faq-item-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 14px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 标签 */
.faq-badge {
  display: inline-block;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 10px;
  border-radius: 4px;
  line-height: 1.6;
  flex-shrink: 0;
}

.faq-badge-client {
  background: #eef4ff;
  color: #2563eb;
}

.faq-badge-admin {
  background: #ecfdf5;
  color: #059669;
}

.dark .faq-badge-client {
  background: rgba(37, 99, 235, 0.15);
  color: #93c5fd;
}

.dark .faq-badge-admin {
  background: rgba(5, 150, 105, 0.15);
  color: #6ee7b7;
}

/* 内容 */
.faq-item-content {
  font-size: 15px;
  line-height: 1.7;
  color: var(--vp-c-text-1);
}

.faq-item-content p {
  margin: 8px 0;
}

.faq-item-content strong {
  font-weight: 600;
}

.faq-item-content ul {
  padding-left: 20px;
  margin: 8px 0;
}

.faq-item-content li {
  margin: 4px 0;
}

.faq-item-content img {
  max-width: 100%;
  border-radius: 6px;
  margin: 12px 0;
  border: 1px solid var(--vp-c-border);
}

.faq-item-content blockquote {
  border-left: 3px solid var(--vp-c-brand-1);
  margin: 12px 0;
  padding: 8px 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 0 4px 4px 0;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.faq-item-content code {
  font-size: 13px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
}

.faq-empty {
  text-align: center;
  color: var(--vp-c-text-3);
  padding: 48px 0;
  font-size: 15px;
}
</style>
