<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShareAPI } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Key, Share2 } from 'lucide-vue-next'
import DarkModeToggle from '@/components/DarkModeToggle.vue'

const route = useRoute()
const router = useRouter()

// 页面状态
const isLoading = ref(false)
const errorMessage = ref('')

// 从URL获取空间ID和密码
const spaceId = ref('')
const password = ref('')

// 处理收藏空间
const handleCollectionSpace = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    
    const response = await ShareAPI.collectionSpace({
      spaceId: spaceId.value,
      password: password.value
    })
    
    // 只有在接口返回成功时才跳转
    if (response.code === 0 || response.flag) {
      // 收藏成功，跳转到空间页面
      router.push(`/space/${spaceId.value}`)
    } else {
      // 显示接口返回的错误信息
      errorMessage.value = response.message || response.description || '收藏失败，请检查密码是否正确'
    }
  } catch (error: any) {
    console.error('收藏空间失败:', error)
    // 显示捕获到的错误信息
    errorMessage.value = error.response?.data?.message || error.message || '收藏失败，请稍后重试'
  } finally {
    isLoading.value = false
  }
}

// 取消收藏，返回首页
const handleCancel = () => {
  router.push('/')
}

onMounted(() => {
  // 从路由参数获取空间ID
  spaceId.value = route.params.id as string
  
  // 从查询参数获取密码
  password.value = (route.query.k as string) || ''
  
  // 如果没有空间ID，直接返回首页
  if (!spaceId.value) {
    router.push('/')
  }
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- 页面头部 -->
    <div class="border-b bg-card">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Button 
              @click="handleCancel" 
              variant="ghost" 
              size="sm"
              class="p-2"
            >
              <ArrowLeft class="w-4 h-4" />
            </Button>
            <div>
              <h1 class="text-xl font-semibold">收藏空间</h1>
              <p class="text-sm text-muted-foreground">确认收藏此分享的空间</p>
            </div>
          </div>
          <DarkModeToggle />
        </div>
      </div>
    </div>

    <!-- 页面内容 -->
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-md mx-auto">
        <Card>
          <CardHeader class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Share2 class="w-8 h-8 text-primary" />
            </div>
            <CardTitle class="text-lg">空间收藏确认</CardTitle>
            <CardDescription>
              收藏后可以在侧边栏"订阅的空间"中快速访问
            </CardDescription>
          </CardHeader>
          
          <CardContent class="space-y-4">
            <!-- 空间ID显示 -->
            <div class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Share2 class="w-4 h-4" />
                <span>空间ID</span>
              </div>
              <div class="bg-muted p-3 rounded-md text-sm font-mono break-all">
                {{ spaceId }}
              </div>
            </div>
            
            <!-- 密码显示 -->
            <div v-if="password" class="space-y-2">
              <div class="flex items-center gap-2 text-sm text-muted-foreground">
                <Key class="w-4 h-4" />
                <span>访问密码</span>
              </div>
              <div class="bg-muted p-3 rounded-md text-sm font-mono">
                {{ password }}
              </div>
            </div>
            
            <!-- 错误提示 -->
            <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <div class="font-medium">收藏失败</div>
              <div>{{ errorMessage }}</div>
            </div>
          </CardContent>
          
          <CardFooter class="flex gap-3">
            <Button 
              @click="handleCancel"
              variant="outline" 
              class="flex-1"
              :disabled="isLoading"
            >
              取消
            </Button>
            <Button
              @click="handleCollectionSpace"
              class="flex-1"
              :disabled="isLoading"
            >
              {{ isLoading ? '收藏中...' : '确认收藏' }}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  </div>
</template>