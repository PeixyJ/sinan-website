<template>
  <div class="flex flex-1 flex-col gap-6 p-4 pt-0">
    <!-- Welcome Section -->
    <div class="rounded-lg border p-6 relative">
      <div class="flex items-start justify-between mb-2">
        <h1 class="text-3xl font-bold">Welcome back!</h1>
        <button
            @click="handleRefresh"
            :class="['p-2 rounded-md hover:bg-muted transition-colors', isRefreshing && 'animate-spin']"
            :disabled="isRefreshing"
            title="刷新书签"
        >
          <RefreshCw class="h-5 w-5"/>
        </button>
      </div>
      <p class="text-muted-foreground mb-6">你从哪个应用开始以下是你最常用的应用</p>

      <!-- Search Bar -->
      <div class="flex gap-2 mb-6">
        <div class="relative flex-1">
          <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索书签名称、网址、描述或标签..."
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pr-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <!-- 搜索状态指示器 -->
          <div v-if="isSearching" class="absolute right-2 top-1/2 -translate-y-1/2">
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        </div>
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
              <Star
                  :class="['mr-2 h-4 w-4', bookmark.star ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground']"/>
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
                <Tag class="h-4 w-4 text-muted-foreground"/>
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

        <!-- Empty State -->
        <div v-if="filteredBookmarks.length === 0"
             class="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
          <svg class="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
          </svg>
          <p>{{ searchQuery ? '没有找到匹配的书签' : '暂无常用书签' }}</p>
          <p class="text-sm">{{ searchQuery ? '请尝试其他搜索词' : '添加一些书签开始使用吧' }}</p>
        </div>
      </div>
    </div>


    <!-- 添加书签弹窗 -->
    <AddBookmarkModal
        v-model:open="showAddBookmarkModal"
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
import {Edit, Trash2, Star, RefreshCw, Tag, Check} from 'lucide-vue-next'

// 响应式数据
const mostVisitedBookmarks = ref<BookmarkResp[]>([])
const searchResults = ref<BookmarkResp[]>([])
const searchQuery = ref('')
const loading = ref(false)
const isRefreshing = ref(false)
const isSearching = ref(false)
const showAddBookmarkModal = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const deletingBookmarkId = ref<string | null>(null)
const availableTags = ref<TagResp[]>([])
const editingBookmark = ref<BookmarkResp | null>(null)

// 分页状态 - 最常访问书签
const pageSize = ref(40) // 显示更多书签以便搜索
const totalCount = ref(0)
const totalPages = ref(0)

// 计算属性 - 显示的书签（搜索时显示搜索结果，否则显示常用书签）
const filteredBookmarks = computed(() => {
  return searchQuery.value.trim() ? searchResults.value : mostVisitedBookmarks.value
})

// 搜索书签
const searchBookmarks = async (query: string) => {
  if (!query.trim()) {
    searchResults.value = []
    return
  }

  try {
    isSearching.value = true
    const response = await BookmarkAPI.getMostVisited({
      search: query.trim(),
      limit: pageSize.value
    }) as any

    if (response?.flag) {
      searchResults.value = response.data || []
    } else {
      searchResults.value = []
    }
  } catch (error) {
    console.error('Search failed:', error)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// 防抖搜索
let searchTimeout: ReturnType<typeof setTimeout> | null = null
const debounceSearch = (query: string) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    searchBookmarks(query)
  }, 300) // 300ms 防抖延迟
}

// 监听搜索输入
watch(searchQuery, (newQuery) => {
  debounceSearch(newQuery)
}, {immediate: false})

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

// 判断图标是否为base64格式
// 判断是否为有效的图标（HTTP URL 或 base64）
const isValidIcon = (icon: number | string): boolean => {
  if (typeof icon !== 'string') return false
  // 检查是否为 HTTP/HTTPS URL
  if (icon.startsWith('http://') || icon.startsWith('https://')) return true
  // 检查是否为 base64 图片
  if (icon.startsWith('data:image/')) return true
  return false
}

// 获取最常访问的书签
const fetchMostVisited = async () => {
  try {
    loading.value = true
    console.log('正在获取最常访问的书签...')
    const response = await BookmarkAPI.getMostVisited({limit: pageSize.value}) as any
    console.log('getMostVisited response:', response)
    if (response?.flag) {
      mostVisitedBookmarks.value = response.data || []
      console.log('成功获取书签:', (response.data || []).length, '个')
      // 注意：getMostVisited API 不返回分页信息，只返回指定数量的记录
      totalCount.value = response.data?.length || 0
      totalPages.value = 1 // 该API不支持分页，只有一页
    } else {
      console.warn('API调用成功但flag为false:', response?.message)
      mostVisitedBookmarks.value = []
      totalCount.value = 0
      totalPages.value = 0
    }
  } catch (error) {
    console.error('Failed to fetch most visited bookmarks:', error)
    mostVisitedBookmarks.value = []
    totalCount.value = 0
    totalPages.value = 0
  } finally {
    loading.value = false
  }
}


// 打开书签
const openBookmark = async (url: string, bookmarkId?: string) => {
  // 如果有书签ID，调用增加使用次数接口
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

// 处理书签添加成功
const handleBookmarkAdded = () => {
  // 重新获取最常访问的书签以显示新添加的书签
  fetchMostVisited()
}

// 处理书签更新成功
const handleBookmarkUpdated = () => {
  // 重新获取最常访问的书签以显示更新后的书签
  fetchMostVisited()
  editingBookmark.value = null
}

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAllList()
    console.log('Tags response:', response)
    availableTags.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
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
      // 从列表中移除已删除的书签
      mostVisitedBookmarks.value = mostVisitedBookmarks.value.filter(b => b.id !== deletingBookmarkId.value)
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
      await fetchMostVisited()
      // 如果当前在搜索状态，也要更新搜索结果
      if (searchQuery.value.trim()) {
        await searchBookmarks(searchQuery.value.trim())
      }
    }
  } catch (error) {
    console.error('Failed to toggle bookmark star:', error)
  }
}

// 刷新数据
const handleRefresh = async () => {
  isRefreshing.value = true
  try {
    await Promise.all([
      fetchMostVisited(),
      fetchTags()
    ])
  } finally {
    isRefreshing.value = false
  }
}

// 切换书签标签
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

    // 立即更新本地数据（包括搜索结果）
    const updateBookmarkInList = (list: BookmarkResp[], bookmarkId: string) => {
      const bookmarkIndex = list.findIndex(b => b.id === bookmarkId)
      if (bookmarkIndex !== -1) {
        const targetTag = availableTags.value.find(t => t.id === tagId)
        if (targetTag) {
          if (isTagSelected) {
            // 移除标签
            list[bookmarkIndex].tags = list[bookmarkIndex].tags?.filter(t => t.id !== tagId) || []
          } else {
            // 添加标签
            if (!list[bookmarkIndex].tags) {
              list[bookmarkIndex].tags = []
            }
            list[bookmarkIndex].tags.push(targetTag)
          }
        }
      }
    }

    updateBookmarkInList(mostVisitedBookmarks.value, bookmark.id)
    updateBookmarkInList(searchResults.value, bookmark.id)

    // 异步更新服务器数据
    const response = await BookmarkAPI.update({
      id: bookmark.id,
      tags: newTagIds.length > 0 ? newTagIds : undefined
    }) as any

    if (!(response?.flag || response?.code === 0)) {
      // 如果服务器更新失败，恢复本地数据
      await fetchMostVisited()
      if (searchQuery.value.trim()) {
        await searchBookmarks(searchQuery.value.trim())
      }
    }
  } catch (error) {
    console.error('Failed to toggle bookmark tag:', error)
    // 出错时重新获取数据以确保同步
    await fetchMostVisited()
    if (searchQuery.value.trim()) {
      await searchBookmarks(searchQuery.value.trim())
    }
  }
}


// 页面加载时获取数据
onMounted(() => {
  fetchMostVisited()
  fetchTags()
})
</script>