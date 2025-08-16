<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
    <!-- Welcome Section -->
    <div class="rounded-lg border p-6">
      <h1 class="text-3xl font-bold mb-2">Welcome back!</h1>
      <p class="text-muted-foreground mb-6">你从哪个应用开始以下是你最常用的应用</p>

      <!-- Search Bar -->
      <div class="flex gap-2 mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索"
          class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          @click="showAddBookmarkModal = true"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
        >
          添加书签
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>

      <!-- App Grid -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        <ContextMenu v-for="bookmark in mostVisitedBookmarks" :key="bookmark.id">
          <ContextMenuTrigger as-child>
            <div
              @click="openBookmark(bookmark.url)"
              class="flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 3v2H7c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2h-2V3H9zm2 2h2v2h-2V5z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ bookmark.name }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ bookmark.url }}</p>
              </div>
              <!-- 标签颜色指示器 -->
              <div v-if="bookmark.tags && bookmark.tags.length > 0" class="flex items-center -space-x-2 flex-shrink-0">
                <div
                  v-for="(tag, index) in bookmark.tags.slice(0, 3)"
                  :key="tag.id"
                  class="h-4 w-4 rounded-full border-2 border-white dark:border-gray-800"
                  :style="{ backgroundColor: tag.color || '#52525b', zIndex: bookmark.tags.length - index }"
                  :title="tag.name"
                />
                <div
                  v-if="bookmark.tags.length > 3"
                  class="h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 bg-gray-400 flex items-center justify-center"
                  :title="`还有 ${bookmark.tags.length - 3} 个标签`"
                >
                  <span class="text-[8px] text-white font-semibold">+{{ bookmark.tags.length - 3 }}</span>
                </div>
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent class="w-64">
            <ContextMenuItem @click="editBookmark(bookmark)">
              <Edit class="mr-2 h-4 w-4" />
              编辑书签
            </ContextMenuItem>
            <ContextMenuSub>
              <ContextMenuSubTrigger>
                <Tag class="mr-2 h-4 w-4" />
                选择标签
              </ContextMenuSubTrigger>
              <ContextMenuSubContent class="w-48">
                <ContextMenuCheckboxItem
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :checked="isTagSelected(bookmark, tag.id)"
                  @click="toggleBookmarkTag(bookmark, tag.id)"
                >
                  <div class="flex items-center gap-2">
                    <div 
                      class="h-3 w-3 rounded-full" 
                      :style="{ backgroundColor: tag.color || '#52525b' }"
                    />
                    {{ tag.name }}
                  </div>
                </ContextMenuCheckboxItem>
                <div v-if="availableTags.length === 0" class="px-2 py-1.5 text-sm text-muted-foreground">
                  暂无可用标签
                </div>
              </ContextMenuSubContent>
            </ContextMenuSub>
            <ContextMenuSeparator />
            <ContextMenuItem @click="deleteBookmark(bookmark.id)" class="text-red-600">
              <Trash2 class="mr-2 h-4 w-4" />
              删除书签
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <!-- Empty State -->
        <div v-if="mostVisitedBookmarks.length === 0" class="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
          <svg class="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          <p>暂无常用书签</p>
          <p class="text-sm">添加一些书签开始使用吧</p>
        </div>
      </div>
    </div>

    <!-- Auto Classification Table -->
    <div class="rounded-lg border p-6">
      <h2 class="text-xl font-semibold mb-4">自动分类书签</h2>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b">
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">名称</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">网址</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">自标空间</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">自标分类</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">标签</th>
              <th class="text-left py-3 px-4 font-medium text-muted-foreground">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bookmark in receivedBookmarks" :key="bookmark.id" class="border-b hover:bg-muted/50">
              <td class="py-3 px-4">
                <div class="font-medium">{{ bookmark.name }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-muted-foreground truncate max-w-xs">{{ bookmark.url }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-muted-foreground">{{ bookmark.group || '未分组' }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="text-muted-foreground">{{ bookmark.namespaceId || '默认分类' }}</div>
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-1 flex-wrap">
                  <span
                    v-if="bookmark.tag"
                    class="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {{ bookmark.tag }}
                  </span>
                  <span
                    v-else
                    class="text-muted-foreground text-xs"
                  >
                    无标签
                  </span>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex gap-2">
                  <button
                    @click="confirmBookmark(bookmark.id)"
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 px-3 py-1 text-xs"
                  >
                    确认
                  </button>
                  <button
                    @click="ignoreBookmark(bookmark.id)"
                    class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1 text-xs"
                  >
                    忽略
                  </button>
                </div>
              </td>
            </tr>
            <!-- Empty State for Received Bookmarks -->
            <tr v-if="receivedBookmarks.length === 0" class="border-b">
              <td colspan="6" class="py-8 text-center text-muted-foreground">
                <div class="flex flex-col items-center justify-center">
                  <svg class="h-8 w-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <p>暂无待分类的书签</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="receivedBookmarks.length > 0" class="flex items-center justify-between pt-4">
        <div class="text-sm text-muted-foreground">
          共 {{ receivedBookmarks.length }} 个待处理项目
        </div>
        <div class="flex items-center gap-2">
          <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1">
            ← Previous
          </button>
          <div class="flex items-center gap-1">
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-8 w-8">
              1
            </button>
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8">
              2
            </button>
            <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 w-8">
              3
            </button>
            <span class="text-sm text-muted-foreground">...</span>
          </div>
          <button class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 py-1">
            Next →
          </button>
        </div>
      </div>
    </div>

    <!-- 添加书签弹窗 -->
    <AddBookmarkModal
      v-model:open="showAddBookmarkModal"
      @success="handleBookmarkAdded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { BookmarkAPI, ReceivedBookmarkAPI, TagAPI } from '@/services/api'
import type { BookmarkResp, ReceivedBookmarkResp, TagResp } from '@/types/api'
import AddBookmarkModal from '@/components/Bookmark/AddBookmarkModal.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuCheckboxItem,
} from '@/components/ui/context-menu'
import { Edit, Trash2, Tag } from 'lucide-vue-next'

// 响应式数据
const mostVisitedBookmarks = ref<BookmarkResp[]>([])
const receivedBookmarks = ref<ReceivedBookmarkResp[]>([])
const searchQuery = ref('')
const loading = ref(false)
const showAddBookmarkModal = ref(false)
const availableTags = ref<TagResp[]>([])
const editingBookmark = ref<BookmarkResp | null>(null)

// 获取最常访问的书签
const fetchMostVisited = async () => {
  try {
    loading.value = true
    console.log('正在获取最常访问的书签...')
    const response = await BookmarkAPI.getMostVisited({ limit: 40 }) as any
    console.log('getMostVisited response:', response)
    if (response?.flag) {
      mostVisitedBookmarks.value = response.data || []
      console.log('成功获取书签:', (response.data || []).length, '个')
    } else {
      console.warn('API调用成功但flag为false:', response?.message)
      // 如果后端没有返回数据或者flag为false，设置为空数组以显示空状态
      mostVisitedBookmarks.value = []
    }
  } catch (error) {
    console.error('Failed to fetch most visited bookmarks:', error)
    // 网络错误时也设置为空数组
    mostVisitedBookmarks.value = []
  } finally {
    loading.value = false
  }
}

// 获取接收的书签（用于自动分类表格）
const fetchReceivedBookmarks = async () => {
  try {
    console.log('正在获取接收的书签...')
    const response = await ReceivedBookmarkAPI.getAll({ state: 1 }) as any // 状态1=待确认
    console.log('getReceivedBookmarks response:', response)
    if (response?.flag) {
      receivedBookmarks.value = response.data || []
      console.log('成功获取接收书签:', (response.data || []).length, '个')
    } else {
      console.warn('获取接收书签失败:', response?.message)
      receivedBookmarks.value = []
    }
  } catch (error) {
    console.error('Failed to fetch received bookmarks:', error)
    receivedBookmarks.value = []
  }
}

// 确认书签
const confirmBookmark = async (id: string) => {
  try {
    const response = await ReceivedBookmarkAPI.confirm(id) as any
    if (response?.flag) {
      // 从列表中移除已确认的书签
      receivedBookmarks.value = receivedBookmarks.value.filter(bookmark => bookmark.id !== id)
      // 重新获取最常访问的书签
      await fetchMostVisited()
    }
  } catch (error) {
    console.error('Failed to confirm bookmark:', error)
  }
}

// 忽略书签
const ignoreBookmark = async (id: string) => {
  try {
    const response = await ReceivedBookmarkAPI.delete(id) as any
    if (response?.flag) {
      // 从列表中移除已忽略的书签
      receivedBookmarks.value = receivedBookmarks.value.filter(bookmark => bookmark.id !== id)
    }
  } catch (error) {
    console.error('Failed to ignore bookmark:', error)
  }
}

// 打开书签
const openBookmark = (url: string) => {
  window.open(url, '_blank')
}

// 处理书签添加成功
const handleBookmarkAdded = () => {
  // 重新获取最常访问的书签以显示新添加的书签
  fetchMostVisited()
}

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAll() as any
    if (response?.code === 0 && response?.data) {
      availableTags.value = response.data.records || []
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 编辑书签
const editBookmark = (bookmark: BookmarkResp) => {
  editingBookmark.value = bookmark
  // TODO: 打开编辑对话框
  console.log('Edit bookmark:', bookmark)
}

// 删除书签
const deleteBookmark = async (id: string) => {
  if (!confirm('确定要删除这个书签吗？')) return
  
  try {
    const response = await BookmarkAPI.delete(id) as any
    if (response?.flag) {
      // 从列表中移除已删除的书签
      mostVisitedBookmarks.value = mostVisitedBookmarks.value.filter(b => b.id !== id)
    }
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  }
}

// 检查标签是否已选中
const isTagSelected = (bookmark: BookmarkResp, tagId: string): boolean => {
  return bookmark.tags?.some(tag => tag.id === tagId) || false
}

// 切换书签标签
const toggleBookmarkTag = async (bookmark: BookmarkResp, tagId: string) => {
  try {
    const currentTagIds = bookmark.tags?.map(t => t.id) || []
    let newTagIds: string[]
    
    if (currentTagIds.includes(tagId)) {
      // 移除标签
      newTagIds = currentTagIds.filter(id => id !== tagId)
    } else {
      // 添加标签
      newTagIds = [...currentTagIds, tagId]
    }
    
    const response = await BookmarkAPI.update({
      id: bookmark.id,
      tags: newTagIds
    }) as any
    
    if (response?.flag) {
      // 更新本地数据
      await fetchMostVisited()
    }
  } catch (error) {
    console.error('Failed to update bookmark tags:', error)
  }
}

// 页面加载时获取数据
onMounted(() => {
  fetchMostVisited()
  fetchReceivedBookmarks()
  fetchTags()
})
</script>