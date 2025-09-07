<template>
  <div class="p-8">
    <h1 class="text-2xl font-bold mb-6">Favicon 测试页面</h1>
    
    <div class="mb-6">
      <h2 class="text-lg font-semibold mb-2">Google Favicon 服务状态</h2>
      <div class="flex items-center gap-2">
        <span>状态：</span>
        <span v-if="!hasChecked" class="text-gray-500">检查中...</span>
        <span v-else-if="canUseGoogle" class="text-green-600">✅ 可访问</span>
        <span v-else class="text-red-600">❌ 不可访问（使用 Sinan API）</span>
      </div>
    </div>

    <div class="grid gap-4">
      <div v-for="site in testSites" :key="site.url" class="flex items-center gap-4 p-4 border rounded-lg">
        <div class="w-12 h-12 flex items-center justify-center">
          <img
            v-if="getFaviconUrl(site.url)"
            :src="getFaviconUrl(site.url)"
            :alt="site.name"
            class="w-8 h-8"
            @error="(e) => onFaviconError(e, site.url)"
            @load="() => onFaviconLoad(site.url)"
          />
          <div v-else class="w-8 h-8 bg-gray-200 rounded"></div>
        </div>
        <div class="flex-1">
          <div class="font-medium">{{ site.name }}</div>
          <div class="text-sm text-gray-500">{{ site.url }}</div>
          <div class="text-xs text-gray-400 mt-1">
            状态：{{ loadStatus[site.url] || '加载中...' }}
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 p-4 bg-gray-100 rounded-lg">
      <h3 class="font-semibold mb-2">测试说明：</h3>
      <ul class="text-sm space-y-1">
        <li>• 首先检查 Google Favicon 服务是否可访问</li>
        <li>• 如果可访问，使用 Google 服务加载图标</li>
        <li>• 如果不可访问或加载失败，自动切换到 Sinan API</li>
        <li>• 每个网站的加载状态会实时显示</li>
      </ul>
    </div>

    <div class="mt-4">
      <button 
        @click="resetAndRetest" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        重置并重新测试
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useFavicon } from '@/composables/useFavicon'
import { resetFaviconAccessCheck } from '@/utils/favicon'

// 使用favicon组合式函数
const { canUseGoogle, hasChecked, getFaviconUrl } = useFavicon()

// 测试网站列表
const testSites = [
  { name: 'Google', url: 'https://www.google.com' },
  { name: 'GitHub', url: 'https://github.com' },
  { name: 'Vue.js', url: 'https://vuejs.org' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
  { name: 'MDN', url: 'https://developer.mozilla.org' },
]

// 加载状态跟踪
const loadStatus = reactive<Record<string, string>>({})

// 处理favicon加载成功
const onFaviconLoad = (url: string) => {
  const source = canUseGoogle.value ? 'Google Favicon' : 'Sinan API'
  loadStatus[url] = `✅ 成功加载 (${source})`
}

// 处理favicon加载错误
const onFaviconError = (event: Event, url: string) => {
  const img = event.target as HTMLImageElement
  const currentSrc = img.src
  
  // 如果当前使用的是Google服务
  if (currentSrc.includes('google.com/s2/favicons')) {
    loadStatus[url] = '⚠️ Google失败，切换到 Sinan API...'
    console.log(`Google favicon failed for ${url}, trying Sinan API`)
    // 切换到Sinan API
    img.src = `/api/favicon/icon?domain=${encodeURIComponent(new URL(url).hostname)}&sz=32`
  } else {
    // 如果Sinan API也失败了，使用默认图标
    loadStatus[url] = '❌ 两个服务都失败，使用默认图标'
    console.log(`Sinan API also failed for ${url}, using default icon`)
    img.src = '/icon.png'
  }
}

// 重置并重新测试
const resetAndRetest = () => {
  resetFaviconAccessCheck()
  Object.keys(loadStatus).forEach(key => {
    delete loadStatus[key]
  })
  window.location.reload()
}
</script>