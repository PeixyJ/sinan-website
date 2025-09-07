// 缓存Google favicon服务的可访问性状态
let googleFaviconAccessible: boolean | null = null

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
 * 检查Google favicon服务是否可访问
 */
export async function checkGoogleFaviconAccess(): Promise<boolean> {
  // 如果已经检查过，直接返回缓存的结果
  if (googleFaviconAccessible !== null) {
    return googleFaviconAccessible
  }

  return new Promise((resolve) => {
    const img = new Image()
    const timeout = setTimeout(() => {
      console.log('Google favicon service timeout, will use fallback API')
      googleFaviconAccessible = false
      resolve(false)
    }, 3000) // 3秒超时

    img.onload = () => {
      clearTimeout(timeout)
      console.log('Google favicon service is accessible')
      googleFaviconAccessible = true
      resolve(true)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      console.log('Google favicon service is not accessible, will use fallback API')
      googleFaviconAccessible = false
      resolve(false)
    }

    // 使用google.com作为测试目标
    img.src = 'https://www.google.com/s2/favicons?domain=google.com&sz=32'
  })
}

/**
 * 获取favicon URL（同步版本，用于初始渲染）
 */
export function getFaviconUrl(url: string, useGoogle: boolean | null = null): string {
  if (!url) return ''
  
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    
    // 如果没有明确指定，则根据系统设置决定
    if (useGoogle === null) {
      const settings = getSystemSettings()
      useGoogle = settings.faviconSource === 'google'
    }
    
    if (useGoogle) {
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } else {
      // 使用Sinan API
      return `/api/favicon/icon?domain=${encodeURIComponent(domain)}&sz=32`
    }
  } catch (error) {
    return ''
  }
}

/**
 * 获取favicon URL（异步版本，自动检测并选择服务）
 */
export async function getFaviconUrlAsync(url: string): Promise<string> {
  if (!url) return ''
  
  try {
    const settings = getSystemSettings()
    
    // 如果设置为Sinan服务，直接使用Sinan
    if (settings.faviconSource === 'sinan') {
      return getFaviconUrl(url, false)
    }
    
    // 如果设置为Google，先检查可访问性
    const canUseGoogle = await checkGoogleFaviconAccess()
    
    // 如果Google可访问，使用Google；否则fallback到Sinan
    return getFaviconUrl(url, canUseGoogle)
  } catch (error) {
    return getFaviconUrl(url, false) // 出错时使用Sinan
  }
}

/**
 * 重置Google favicon可访问性检查缓存
 */
export function resetFaviconAccessCheck(): void {
  googleFaviconAccessible = null
}