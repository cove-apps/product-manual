<template>
  <div class="download-nav" ref="menuRef">
    <button
      class="download-trigger"
      :class="{ active: open }"
      @click="open = !open"
    >
      <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      <span>下载</span>
      <svg class="chevron" :class="{ rotated: open }" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Transition name="fade">
      <div v-if="open" class="dropdown" @click="open = false">
        <a
          v-for="item in items"
          :key="item.label"
          :href="withBase(item.path)"
          class="item"
          download
        >
          {{ item.label }}
        </a>
        <hr class="divider">
        <a
          :href="withBase('/downloads/OfficeAI-产品手册合集.zip')"
          class="item all"
          download
        >
          <svg class="zip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <polyline points="9 15 12 18 15 15"/>
          </svg>
          下载全部
          <span class="badge">ZIP</span>
        </a>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { withBase } from 'vitepress'

const open = ref(false)
const menuRef = ref(null)

const items = [
  { label: '客户端手册', path: '/downloads/OfficeAI-客户端手册.pdf' },
  { label: '服务端手册', path: '/downloads/OfficeAI-服务端手册.pdf' },
  { label: '产品白皮书', path: '/downloads/OfficeAI-产品白皮书.pdf' },
  { label: '更新日志', path: '/downloads/OfficeAI-更新日志.pdf' },
]

function onClick(e) {
  if (menuRef.value && !menuRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onClick))
onUnmounted(() => document.removeEventListener('click', onClick))
</script>

<style scoped>
.download-nav {
  position: relative;
  display: flex;
  align-items: center;
}

.download-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  height: var(--vp-nav-height, 56px);
  padding: 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.2s;
}

.download-trigger:hover,
.download-trigger.active {
  color: var(--vp-c-brand-1);
}

.icon {
  flex-shrink: 0;
}

.chevron {
  flex-shrink: 0;
  transition: transform 0.2s;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  min-width: 180px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  padding: 6px 0;
  z-index: 100;
}

.item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.item:hover {
  background: var(--vp-c-brand-soft, rgba(37,99,235,0.08));
  color: var(--vp-c-brand-1);
}

.item.all {
  font-weight: 500;
}

.divider {
  margin: 4px 12px;
  border: none;
  border-top: 1px solid var(--vp-c-border);
}

.badge {
  margin-left: auto;
  font-size: 11px;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft, rgba(37,99,235,0.08));
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.4;
}

.zip-icon {
  flex-shrink: 0;
}

/* fade transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s, transform 0.15s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
