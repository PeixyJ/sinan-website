<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- 标签标题和描述 -->
    <div class="mb-4">
      <div class="flex items-center gap-3 mb-2">
        <div 
          class="h-8 w-8 rounded-full"
          :style="{ backgroundColor: currentTag?.color || '#52525b' }"
        />
        <h1 class="text-3xl font-bold">{{ currentTag?.name || '加载中...' }}</h1>
      </div>
      <p class="text-muted-foreground">{{ currentTag?.description || '暂无描述' }}</p>
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
          <ContextMenuItem @click="editBookmark(bookmark)" class="flex items-center">
            <Edit class="mr-2 h-4 w-4 text-muted-foreground" />
            <span>编辑书签</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem @click="deleteBookmark(bookmark.id)" class="flex items-center text-red-600">
            <Trash2 class="mr-2 h-4 w-4" />
            <span>删除书签</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>

    <!-- 空状态 -->
    <div v-else class="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <svg class="h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { BookmarkAPI, TagAPI } from '@/services/api'
import type { BookmarkResp, TagResp } from '@/types/api'
import AddBookmarkModal from '@/components/Bookmark/AddBookmarkModal.vue'
import EditBookmarkDialog from '@/components/Bookmark/EditBookmarkDialog.vue'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Edit, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const tagId = computed(() => route.params.id as string)

// 响应式数据
const bookmarks = ref<BookmarkResp[]>([])
const currentTag = ref<TagResp | null>(null)
const searchQuery = ref('')
const loading = ref(false)
const showAddBookmarkModal = ref(false)
const showEditDialog = ref(false)
const editingBookmark = ref<BookmarkResp | null>(null)

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
const openBookmark = (url: string) => {
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

// 删除书签
const deleteBookmark = async (id: string) => {
  if (!confirm('确定要删除这个书签吗？')) return
  
  try {
    const response = await BookmarkAPI.delete(id) as any
    if (response?.flag) {
      bookmarks.value = bookmarks.value.filter(b => b.id !== id)
    }
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
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

// 监听路由变化
watch(tagId, () => {
  fetchTagInfo()
  fetchBookmarks()
})

// 页面加载时获取数据
onMounted(() => {
  fetchTagInfo()
  fetchBookmarks()
})
</script>