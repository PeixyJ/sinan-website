import { ref, onMounted, reactive, watch } from 'vue'
import { checkGoogleFaviconAccess, getFaviconUrl } from '@/utils/favicon'
import { eventBus } from '@/utils/eventBus'

/**
 * 从Cookie获取系统设置
 */
function getSystemSettings(): { faviconSource?: string } {
  try {
    const cookies = document.cookie.split('; ')
    const settingsCookie = cookies.find(cookie => cookie.startsWith('systemSettings='))
    
    if (settingsCookie) {
      const settings = JSON.parse(decodeURIComponent(settingsCookie.split('=')[1]))
      return settings
    }
  } catch (error) {
    console.error('Failed to parse system settings:', error)
  }
  return { faviconSource: 'google' } // 默认使用Google
}

/**
 * Vue组合式函数，用于处理favicon加载
 */
export function useFavicon() {
  // 系统设置
  const systemSettings = ref(getSystemSettings())
  
  // 是否可以使用Google favicon服务
  const canUseGoogle = ref(true)
  
  // 已检查过可访问性
  const hasChecked = ref(false)
  
  // 记录每个URL尝试过的服务
  const triedGoogle = reactive<Record<string, boolean>>({})
  
  // 监听系统设置更新事件
  onMounted(() => {
    eventBus.on('SYSTEM_SETTINGS_UPDATED', (settings: any) => {
      systemSettings.value = settings
      // 清空缓存，让图标重新加载
      Object.keys(triedGoogle).forEach(key => delete triedGoogle[key])
    })
  })
  
  // 初始化时检查Google favicon服务可访问性（仅当设置为Google时）
  onMounted(async () => {
    if (!hasChecked.value && systemSettings.value.faviconSource === 'google') {
      const isAccessible = await checkGoogleFaviconAccess()
      canUseGoogle.value = isAccessible
      hasChecked.value = true
      console.log('Favicon service check complete:', isAccessible ? 'Google' : 'Sinan API')
    }
  })
  
  /**
   * 获取favicon URL
   */
  const getFaviconUrlForBookmark = (url: string): string => {
    if (!url) return ''
    
    // 如果设置为Sinan服务，直接使用Sinan
    if (systemSettings.value.faviconSource === 'sinan') {
      return getFaviconUrl(url, false)
    }
    
    // 如果设置为Google服务
    if (systemSettings.value.faviconSource === 'google') {
      // 如果已经尝试过Google且失败了，使用Sinan作为fallback
      if (triedGoogle[url] === false) {
        return getFaviconUrl(url, false)
      }
      // 使用Google（如果可访问）
      return getFaviconUrl(url, canUseGoogle.value)
    }
    
    // 默认使用Google（向后兼容）
    return getFaviconUrl(url, canUseGoogle.value)
  }
  
  /**
   * 处理图片加载错误，返回fallback URL
   */
  const handleFaviconError = (url: string): string => {
    if (!url) return ''
    
    const img = event?.target as HTMLImageElement
    const currentSrc = img?.src || ''
    
    // 如果设置为Sinan服务，且Sinan失败了，返回默认图标
    if (systemSettings.value.faviconSource === 'sinan') {
      if (currentSrc.includes('/api/favicon/icon')) {
        console.log(`Sinan API failed for ${url}, using default icon`)
        return '/icon.png'
      }
    }
    
    // 如果设置为Google服务
    if (systemSettings.value.faviconSource === 'google') {
      // 如果当前使用的是Google服务的URL且失败了
      if (currentSrc.includes('google.com/s2/favicons')) {
        console.log(`Google favicon failed for ${url}, switching to Sinan API`)
        triedGoogle[url] = false
        return getFaviconUrl(url, false) // 返回Sinan API的URL作为fallback
      }
      
      // 如果Sinan API也失败了，返回默认图标
      if (currentSrc.includes('/api/favicon/icon')) {
        console.log(`Sinan API also failed for ${url}, using default icon`)
        return '/icon.png'
      }
    }
    
    // 默认返回默认图标
    return '/icon.png'
  }
  
  return {
    canUseGoogle,
    hasChecked,
    getFaviconUrl: getFaviconUrlForBookmark,
    handleFaviconError
  }
}