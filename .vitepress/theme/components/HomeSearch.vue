<template>
  <div ref="searchRef" class="home-search" @click="openSearch">
    <div class="home-search-bar">
      <svg class="home-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <span class="home-search-placeholder">搜索全部文档...</span>
      <kbd class="home-search-shortcut">{{ isMac ? '⌘K' : 'Ctrl+K' }}</kbd>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'

const isMac = computed(() => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform))
const searchRef = ref(null)

onMounted(() => {
  // 把搜索条从内容区移到英雄区和功能卡片之间
  const el = searchRef.value
  if (!el) return
  const hero = document.querySelector('.VPHomeHero')
  const features = document.querySelector('.VPHomeFeatures')
  if (hero && features && features.parentNode) {
    features.parentNode.insertBefore(el, features)
  }
})

function openSearch() {
  const btn = document.querySelector('.VPNavBarSearchButton button')
  if (btn) {
    btn.click()
    return
  }
  document.dispatchEvent(new KeyboardEvent('keydown', {
    key: 'k',
    metaKey: isMac.value,
    ctrlKey: !isMac.value,
    bubbles: true,
  }))
}
</script>

<style scoped>
.home-search {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 24px 24px;
  width: 100%;
  box-sizing: border-box;
}

.home-search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 14px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.home-search-bar:hover {
  border-color: var(--vp-c-brand-2);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.1);
  background: var(--vp-c-bg-mute);
  transform: translateY(-1px);
}

.home-search-icon {
  width: 22px;
  height: 22px;
  color: var(--vp-c-brand-1);
  flex-shrink: 0;
}

.home-search-placeholder {
  flex: 1;
  color: var(--vp-c-text-2);
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
}

.home-search-shortcut {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 5px;
  font-size: 12px;
  font-family: inherit;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .home-search {
    padding: 20px 16px 16px;
  }
  .home-search-bar {
    padding: 14px 18px;
  }
  .home-search-shortcut {
    display: none;
  }
}
</style>
