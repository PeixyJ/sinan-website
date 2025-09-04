<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- 标签标题和描述 -->
    <div class="mb-4">
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <div
                class="h-8 w-8 rounded-full"
                :style="{ backgroundColor: currentTag?.color || '#52525b' }"
            />
            <h1 class="text-3xl font-bold">{{ currentTag?.name || '加载中...' }}</h1>
          </div>
          <p class="text-muted-foreground">{{ currentTag?.description || '暂无描述' }}</p>
        </div>
        <button
          @click="handleRefresh"
          :class="['p-2 rounded-md hover:bg-muted transition-colors', isRefreshing && 'animate-spin']"
          :disabled="isRefreshing"
          title="刷新书签"
        >
          <RefreshCw class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- 搜索和添加按钮 -->
    <div class="flex gap-2 mb-4">
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

    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <!-- 书签网格 -->
    <div v-else-if="filteredBookmarks.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
      <ContextMenu v-for="bookmark in filteredBookmarks" :key="bookmark.id">
        <ContextMenuTrigger as-child>
          <div
              @click="openBookmark(bookmark.url, bookmark.id)"
              :class="[
                'flex items-center gap-3 p-3 rounded-lg border bg-card text-card-foreground transition-all cursor-pointer',
                bookmark.star 
                  ? 'shadow-[0_0_15px_rgba(251,191,36,0.2)] hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] border-amber-200/50' 
                  : 'shadow-sm hover:shadow-md'
              ]"
          >
            <div class="flex h-8 w-8 items-center justify-center rounded-md bg-muted overflow-hidden">
              <!-- 优先使用存储的图标（HTTP URL 或 base64） -->
              <img
                v-if="isValidIcon(bookmark.icon)"
                :src="String(bookmark.icon)"
                :alt="bookmark.name"
                class="h-full w-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).src = '/icon.png'"
              />
              <!-- 其次使用Google Favicon服务，失败时降级到项目Logo -->
              <img
                v-else-if="getFaviconUrl(bookmark.url)"
                :src="getFaviconUrl(bookmark.url)"
                :alt="bookmark.name"
                class="h-full w-full object-cover"
                @error="(e) => (e.target as HTMLImageElement).src = '/icon.png'"
              />
              <!-- 默认使用项目Logo -->
              <img
                v-else
                src="/icon.png"
                :alt="bookmark.name"
                class="h-full w-full object-cover"
              />
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
          <ContextMenuItem @click="toggleBookmarkStar(bookmark)" class="flex items-center">
            <CircleStar :class="['mr-2 h-4 w-4', bookmark.star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground']"/>
            <span>{{ bookmark.star ? '取消星标' : '添加星标' }}</span>
          </ContextMenuItem>
          <ContextMenuItem @click="editBookmark(bookmark)" class="flex items-center">
            <Edit class="mr-2 h-4 w-4 text-muted-foreground"/>
            <span>编辑书签</span>
          </ContextMenuItem>
          <ContextMenuSeparator/>
          <!-- 标签选择区域 -->
          <div class="px-2 py-2">
            <div class="flex items-center gap-2 mb-2">
              <Tag class="h-4 w-4 text-muted-foreground" />
              <span class="text-sm font-medium">标签</span>
            </div>
            <div v-if="availableTags.length === 0" class="text-sm text-muted-foreground">
              暂无可用标签
            </div>
            <div v-else class="flex flex-wrap gap-1">
              <button
                v-for="tag in availableTags"
                :key="tag.id"
                @pointerdown.stop.prevent="handleTagToggle(bookmark, tag.id, $event)"
                :class="[
                  'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors',
                  bookmark.tags?.some(t => t.id === tag.id)
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-muted hover:bg-muted/80 border border-transparent'
                ]"
              >
                <div 
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: tag.color || '#52525b' }"
                />
                <span>{{ tag.name }}</span>
                <Check 
                  v-if="bookmark.tags?.some(t => t.id === tag.id)"
                  class="h-3 w-3 ml-0.5"
                />
              </button>
            </div>
          </div>
          <ContextMenuSeparator/>
          <ContextMenuItem @click="confirmDeleteBookmark(bookmark.id)" class="flex items-center text-red-600">
            <Trash2 class="mr-2 h-4 w-4"/>
            <span>删除书签</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <svg class="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
      </svg>
      <p>暂无书签</p>
      <p class="text-sm">在此标签下添加一些书签开始使用吧</p>
    </div>

    <!-- 添加书签弹窗 -->
    <AddBookmarkModal
        v-model:open="showAddBookmarkModal"
        :default-tag-ids="[tagId]"
        @success="handleBookmarkAdded"
    />

    <!-- 编辑书签弹窗 -->
    <EditBookmarkDialog
        v-model:open="showEditDialog"
        :bookmark="editingBookmark"
        @success="handleBookmarkUpdated"
    />

    <!-- 删除确认对话框 -->
    <AlertDialog v-model:open="showDeleteDialog">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
            您确定要删除这个书签吗？此操作不可撤销。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction @click="deleteBookmark" class="bg-red-600 hover:bg-red-700">
            删除
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, computed, watch} from 'vue'
import {useRoute} from 'vue-router'
import {BookmarkAPI, TagAPI} from '@/services/api'
import type {BookmarkResp, TagResp} from '@/types/api'
import AddBookmarkModal from '@/components/Bookmark/AddBookmarkModal.vue'
import EditBookmarkDialog from '@/components/Bookmark/EditBookmarkDialog.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {Edit, Trash2, CircleStar, RefreshCw, Tag, Check} from 'lucide-vue-next'

const route = useRoute()
const tagId = computed(() => route.params.id as string)

// 响应式数据
const bookmarks = ref<BookmarkResp[]>([])
const currentTag = ref<TagResp | null>(null)
const availableTags = ref<TagResp[]>([])
const searchQuery = ref('')
const loading = ref(false)
const isRefreshing = ref(false)
const showAddBookmarkModal = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const deletingBookmarkId = ref<string | null>(null)
const editingBookmark = ref<BookmarkResp | null>(null)

// 获取网站的favicon URL
const getFaviconUrl = (url: string): string => {
  try {
    const urlObj = new URL(url)
    const domain = urlObj.hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  } catch (error) {
    // URL解析失败，返回空字符串
    return ''
  }
}

// 判断是否为有效的图标（HTTP URL 或 base64）
const isValidIcon = (icon: number | string): boolean => {
  if (typeof icon !== 'string') return false
  // 检查是否为 HTTP/HTTPS URL
  if (icon.startsWith('http://') || icon.startsWith('https://')) return true
  // 检查是否为 base64 图片
  if (icon.startsWith('data:image/')) return true
  return false
}

// 过滤后的书签
const filteredBookmarks = computed(() => {
  if (!searchQuery.value) return bookmarks.value

  const query = searchQuery.value.toLowerCase()
  return bookmarks.value.filter(bookmark =>
      bookmark.name?.toLowerCase().includes(query) ||
      bookmark.url?.toLowerCase().includes(query) ||
      bookmark.description?.toLowerCase().includes(query)
  )
})

// 获取标签信息
const fetchTagInfo = async () => {
  try {
    const response = await TagAPI.getById(tagId.value) as any
    if (response?.code === 0 && response?.data) {
      currentTag.value = response.data
    }
  } catch (error) {
    console.error('Failed to fetch tag info:', error)
  }
}

// 获取标签下的书签
const fetchBookmarks = async () => {
  try {
    loading.value = true
    const response = await BookmarkAPI.getByTagId(tagId.value) as any
    if (response?.flag && response?.data) {
      bookmarks.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch bookmarks:', error)
  } finally {
    loading.value = false
  }
}

// 打开书签
const openBookmark = async (url: string, bookmarkId?: string) => {
  // 如果提供了bookmarkId，先调用增加使用次数接口
  if (bookmarkId) {
    try {
      await BookmarkAPI.incrementUsage(bookmarkId)
    } catch (error) {
      console.error('记录书签使用失败:', error)
      // 即使记录失败，仍然打开书签
    }
  }
  window.open(url, '_blank')
}

// 编辑书签
const editBookmark = async (bookmark: BookmarkResp) => {
  try {
    // 获取完整的书签信息，包含所有标签
    const response = await BookmarkAPI.getBookmarkById(bookmark.id) as any
    if (response?.flag && response?.data) {
      editingBookmark.value = response.data
      showEditDialog.value = true
    } else {
      console.error('Failed to fetch bookmark details')
    }
  } catch (error) {
    console.error('Failed to fetch bookmark for editing:', error)
  }
}

// 显示删除确认对话框
const confirmDeleteBookmark = (id: string) => {
  deletingBookmarkId.value = id
  showDeleteDialog.value = true
}

// 删除书签
const deleteBookmark = async () => {
  if (!deletingBookmarkId.value) return

  try {
    const response = await BookmarkAPI.delete(deletingBookmarkId.value) as any
    if (response?.flag) {
      bookmarks.value = bookmarks.value.filter(b => b.id !== deletingBookmarkId.value)
    }
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  } finally {
    showDeleteDialog.value = false
    deletingBookmarkId.value = null
  }
}

// 切换书签星标状态
const toggleBookmarkStar = async (bookmark: BookmarkResp) => {
  try {
    const response = await BookmarkAPI.toggleStar(bookmark.id) as any
    if (response?.flag || response?.code === 0) {
      // 重新加载书签数据以获取最新状态
      await fetchBookmarks()
    }
  } catch (error) {
    console.error('Failed to toggle bookmark star:', error)
  }
}

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAllList()
    if (response.code === 0 && response.data) {
      availableTags.value = response.data.sort((a: any, b: any) => (a.sort || 0) - (b.sort || 0))
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 处理标签切换（防止菜单关闭）
const handleTagToggle = async (bookmark: BookmarkResp, tagId: string, event: Event) => {
  event.stopPropagation()
  event.preventDefault()
  
  try {
    const currentTagIds = bookmark.tags
      ?.map(t => t.id)
      ?.filter(id => id != null && id !== '') || []
    
    let newTagIds: string[]
    const isTagSelected = currentTagIds.includes(tagId)
    
    if (isTagSelected) {
      newTagIds = currentTagIds.filter(id => id !== tagId)
    } else {
      newTagIds = [...currentTagIds, tagId]
    }
    
    // 立即更新本地数据
    const bookmarkIndex = bookmarks.value.findIndex(b => b.id === bookmark.id)
    if (bookmarkIndex !== -1) {
      const targetTag = availableTags.value.find(t => t.id === tagId)
      if (targetTag) {
        if (isTagSelected) {
          // 移除标签
          bookmarks.value[bookmarkIndex].tags = bookmarks.value[bookmarkIndex].tags?.filter(t => t.id !== tagId) || []
        } else {
          // 添加标签
          if (!bookmarks.value[bookmarkIndex].tags) {
            bookmarks.value[bookmarkIndex].tags = []
          }
          bookmarks.value[bookmarkIndex].tags.push(targetTag)
        }
      }
    }
    
    // 异步更新服务器数据
    const response = await BookmarkAPI.update({
      id: bookmark.id,
      tags: newTagIds.length > 0 ? newTagIds : undefined
    }) as any
    
    if (!(response?.flag || response?.code === 0)) {
      // 如果服务器更新失败，恢复本地数据
      await fetchBookmarks()
    }
  } catch (error) {
    console.error('Failed to toggle bookmark tag:', error)
    // 出错时重新获取数据以确保同步
    await fetchBookmarks()
  }
}


// 处理书签添加成功
const handleBookmarkAdded = () => {
  fetchBookmarks()
}

// 处理书签更新成功
const handleBookmarkUpdated = () => {
  fetchBookmarks()
  editingBookmark.value = null
}

// 刷新数据
const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      fetchTagInfo(),
      fetchBookmarks()
    ])
  } finally {
    isRefreshing.value = false
  }
}

// 监听路由变化
watch(tagId, () => {
  fetchTagInfo()
  fetchBookmarks()
})

// 页面加载时获取数据
onMounted(() => {
  fetchTagInfo()
  fetchBookmarks()
  fetchTags()
})
</script>