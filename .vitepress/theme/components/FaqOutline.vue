<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vitepress'

// @ts-ignore
import faqData from '../../../cove/faq/faq-data.json'

const route = useRoute()
const isFaqPage = computed(() => route.path.endsWith('/cove/faq/'))

const allIds = computed(() => faqData.map((item: any) => item.id))

function scrollTo(id: string) {
  location.hash = '#' + id
}
</script>

<template>
  <aside v-if="isFaqPage && allIds.length > 0" class="faq-outline">
    <h2 class="faq-outline-title">本页内容</h2>
    <ul class="faq-outline-list">
      <li v-for="id in allIds" :key="id" class="faq-outline-item">
        <a :href="`#${id}`" @click.prevent="scrollTo(id)" class="faq-outline-link">
          {{ faqData.find((i: any) => i.id === id)?.title }}
        </a>
      </li>
    </ul>
  </aside>
</template>

<style scoped>
.faq-outline {
  margin-bottom: 24px;
}

.faq-outline-title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  margin: 0 0 8px 0;
  color: var(--vp-c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.faq-outline-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.faq-outline-item {
  margin: 0;
  line-height: 1.6;
}

.faq-outline-link {
  display: block;
  font-size: 13px;
  padding: 3px 12px 3px 12px;
  border-left: 2px solid transparent;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s, border-color 0.2s;
  word-break: break-all;
  overflow-wrap: break-word;
}

.faq-outline-link:hover {
  color: var(--vp-c-brand-1);
  border-left-color: var(--vp-c-brand-1);
}
</style>
