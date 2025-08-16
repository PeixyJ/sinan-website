<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- 标题部分 -->
    <div>
      <h1 class="text-3xl font-bold">游离书签</h1>
      <p class="text-muted-foreground mt-2">
        不在任何空间下的书签，它们只能游离在系统中。将它拖拽至空间中吧！
      </p>
    </div>

    <!-- 搜索框和添加按钮 -->
    <div class="flex items-center gap-4">
      <Input
        v-model="searchQuery"
        placeholder="搜索"
        class="max-w-sm"
        @input="handleSearch"
      />
      <Button @click="openAddModal">
        添加标签
      </Button>
    </div>

    <!-- 拖拽区域 -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <!-- 未分配书签列 -->
      <div class="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <div class="flex items-center justify-center mb-4">
          <Plus class="h-6 w-6" />
        </div>
        <h3 class="text-center font-medium mb-4">恒云智联</h3>
        <draggable
          v-model="unassignedBookmarks"
          group="bookmarks"
          class="min-h-[400px] space-y-2"
          :animation="200"
          @change="handleDragChange"
        >
          <template #item="{ element }">
            <div
              class="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-lg border cursor-move hover:shadow-sm transition-shadow"
            >
              <FileText class="h-4 w-4 text-gray-500" />
              <span class="text-sm truncate flex-1">{{ element.name }}</span>
              <div 
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: getBookmarkColor(element) }"
              />
            </div>
          </template>
        </draggable>
      </div>

      <!-- 空间列 -->
      <div 
        v-for="space in spaces" 
        :key="space.id"
        class="border rounded-lg p-4 bg-white dark:bg-gray-800"
      >
        <div class="flex items-center justify-center mb-4">
          <Plus class="h-6 w-6" />
        </div>
        <h3 class="text-center font-medium mb-4">{{ space.name }}</h3>
        <draggable
          v-model="space.bookmarks"
          group="bookmarks"
          class="min-h-[400px] space-y-2"
          :animation="200"
          @change="(evt) => handleSpaceDragChange(evt, space)"
        >
          <template #item="{ element }">
            <div
              class="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border cursor-move hover:shadow-sm transition-shadow"
            >
              <FileText class="h-4 w-4 text-gray-500" />
              <span class="text-sm truncate flex-1">{{ element.name }}</span>
              <div 
                class="w-2 h-2 rounded-full"
                :style="{ backgroundColor: getBookmarkColor(element) }"
              />
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <!-- 添加书签模态框 -->
    <AddBookmarkModal
      v-model:open="addModalOpen"
      @success="handleAddSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, FileText } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import AddBookmarkModal from '@/components/Bookmark/AddBookmarkModal.vue'
import { BookmarkAPI, SpaceAPI } from '@/services/api'
import type { BookmarkResp, SpaceResp, EditBookmarkReq } from '@/types/api'
import { debounce } from 'lodash-es'

interface SpaceWithBookmarks extends SpaceResp {
  bookmarks: BookmarkResp[]
}

// 数据状态
const unassignedBookmarks = ref<BookmarkResp[]>([])
const spaces = ref<SpaceWithBookmarks[]>([])
const allBookmarks = ref<BookmarkResp[]>([])
const searchQuery = ref('')
const addModalOpen = ref(false)
const loading = ref(false)

// 预定义的颜色数组（用于模拟标签颜色）
const colors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

// 获取书签的颜色（根据书签ID生成固定颜色）
const getBookmarkColor = (bookmark: BookmarkResp) => {
  // 如果书签有标签，使用第一个标签的颜色
  if (bookmark.tags && bookmark.tags.length > 0) {
    return bookmark.tags[0].color || '#6b7280'
  }
  // 否则根据ID生成一个固定的颜色
  const index = parseInt(bookmark.id.slice(-1), 16) % colors.length
  return colors[index]
}

// 获取所有书签
const fetchBookmarks = async () => {
  try {
    loading.value = true
    
    // 获取所有空间
    const spaceResponse = await SpaceAPI.getAll({ size: 100 })
    if (spaceResponse.code === 0 && spaceResponse.data) {
      // 初始化空间，每个空间创建一个空的书签数组
      spaces.value = spaceResponse.data.records.slice(0, 4).map(space => ({
        ...space,
        bookmarks: []
      }))
    }

    // 获取最常访问的书签作为示例数据
    const bookmarkResponse = await BookmarkAPI.getMostVisited({ limit: 40 })
    if (bookmarkResponse.code === 0 && bookmarkResponse.data) {
      allBookmarks.value = bookmarkResponse.data
      
      // 分配书签到不同的列
      bookmarkResponse.data.forEach((bookmark, index) => {
        if (bookmark.namespaceId && spaces.value.length > 0) {
          // 如果书签有空间ID，尝试分配到对应空间
          const spaceIndex = spaces.value.findIndex(s => s.id === bookmark.namespaceId)
          if (spaceIndex !== -1) {
            spaces.value[spaceIndex].bookmarks.push(bookmark)
          } else {
            // 随机分配到某个空间
            const randomSpaceIndex = index % spaces.value.length
            spaces.value[randomSpaceIndex].bookmarks.push(bookmark)
          }
        } else {
          // 没有空间ID的书签放到未分配列表
          unassignedBookmarks.value.push(bookmark)
        }
      })
    }
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = debounce(() => {
  // 实现搜索逻辑
  console.log('搜索:', searchQuery.value)
}, 300)

// 处理未分配书签的拖拽
const handleDragChange = (evt: any) => {
  if (evt.added) {
    // 书签被拖回未分配区域，清除其空间ID
    const bookmark = evt.added.element as BookmarkResp
    updateBookmarkSpace(bookmark.id, null)
  }
}

// 处理空间内的拖拽
const handleSpaceDragChange = (evt: any, space: SpaceWithBookmarks) => {
  if (evt.added) {
    // 书签被拖入空间，更新其空间ID
    const bookmark = evt.added.element as BookmarkResp
    updateBookmarkSpace(bookmark.id, space.id)
  }
}

// 更新书签的空间
const updateBookmarkSpace = async (bookmarkId: string, spaceId: string | null) => {
  try {
    const updateData: EditBookmarkReq = {
      id: bookmarkId,
      namespaceId: spaceId || undefined
    }
    
    const response = await BookmarkAPI.update(updateData)
    if (response.code === 0) {
      console.log('书签空间更新成功')
    }
  } catch (error) {
    console.error('更新书签空间失败:', error)
    // 可以在这里添加错误提示或回滚操作
  }
}

// 打开添加模态框
const openAddModal = () => {
  addModalOpen.value = true
}

// 处理添加成功
const handleAddSuccess = () => {
  fetchBookmarks() // 重新加载数据
}

// 初始化
onMounted(() => {
  fetchBookmarks()
})
</script>

<style scoped>
/* 自定义拖拽时的样式 */
.sortable-ghost {
  opacity: 0.5;
}

.sortable-drag {
  opacity: 0.8;
  transform: rotate(2deg);
}
</style>