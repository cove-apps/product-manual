<template>
  <div class="home-search" @click="openSearch">
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
import { computed } from 'vue'

const isMac = computed(() => typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform))

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
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 24px 32px;
}

.home-search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
  transition: all 0.25s;
}

.home-search-bar:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  background: var(--vp-c-bg-mute);
}

.home-search-icon {
  width: 20px;
  height: 20px;
  color: var(--vp-c-text-3);
  flex-shrink: 0;
}

.home-search-placeholder {
  flex: 1;
  color: var(--vp-c-text-2);
  font-size: 14px;
  line-height: 1;
}

.home-search-shortcut {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
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
    padding-top: 24px;
  }
  .home-search-shortcut {
    display: none;
  }
}
</style>
