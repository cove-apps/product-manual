<template>
  <img
    class="VPImage image-src"
    :src="logoSrc"
    alt="OfficeAI"
  />
</template>

<script setup>
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

const { isDark } = useData()
const logoSrc = computed(() =>
  withBase(isDark.value ? '/officeai-nav-logo-dark.png' : '/officeai-nav-logo-light.png')
)
</script>
