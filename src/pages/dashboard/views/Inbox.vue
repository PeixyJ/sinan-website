<template>
  <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
    <!-- 标题部分 -->
    <div>
      <h1 class="text-3xl font-bold">Welcome back!</h1>
      <p class="text-muted-foreground mt-2">分类收到的书签</p>
    </div>

    <!-- 搜索框和列选择器 -->
    <div class="flex items-center justify-between">
      <Input
        v-model="searchQuery"
        placeholder="搜索书签"
        class="max-w-sm"
        @input="handleSearch"
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" class="ml-auto">
            Columns <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuCheckboxItem
            v-for="column in columns"
            :key="column.key"
            :checked="column.visible"
            @update:checked="(value: boolean) => toggleColumn(column.key, value)"
          >
            {{ column.label }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 表格 -->
    <div class="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[40px]">
              <input
                type="checkbox"
                :checked="isAllSelected"
                @change="toggleSelectAll"
                class="rounded border-gray-300"
              />
            </TableHead>
            <TableHead v-if="columns.find(c => c.key === 'name')?.visible">名称</TableHead>
            <TableHead v-if="columns.find(c => c.key === 'url')?.visible">网址 ↑↓</TableHead>
            <TableHead v-if="columns.find(c => c.key === 'group')?.visible">建议分组</TableHead>
            <TableHead v-if="columns.find(c => c.key === 'tags')?.visible">建议分类</TableHead>
            <TableHead v-if="columns.find(c => c.key === 'tags2')?.visible">建议标签</TableHead>
            <TableHead v-if="columns.find(c => c.key === 'actions')?.visible" class="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="loading">
            <TableCell :colspan="7" class="text-center py-10">
              <div class="flex items-center justify-center">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-else-if="bookmarks.length === 0">
            <TableCell :colspan="7" class="text-center py-10 text-muted-foreground">
              暂无收到的书签
            </TableCell>
          </TableRow>
          <TableRow 
            v-else
            v-for="bookmark in paginatedBookmarks" 
            :key="bookmark.id"
            :class="{ 'bg-gray-50': selectedBookmarks.includes(bookmark.id) }"
          >
            <TableCell>
              <input
                type="checkbox"
                :checked="selectedBookmarks.includes(bookmark.id)"
                @change="toggleSelectBookmark(bookmark.id)"
                class="rounded border-gray-300"
              />
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'name')?.visible" class="font-medium">
              {{ bookmark.name }}
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'url')?.visible">
              <a :href="bookmark.url" target="_blank" class="text-blue-600 hover:underline">
                {{ bookmark.url }}
              </a>
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'group')?.visible">
              <span class="text-muted-foreground">{{ bookmark.group || '学习空间' }}</span>
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'tags')?.visible">
              <div class="flex gap-1">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  英语
                </span>
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  学习
                </span>
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  工具
                </span>
              </div>
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'tags2')?.visible">
              <div class="flex gap-1">
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  英语
                </span>
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  学习
                </span>
                <span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                  工具
                </span>
              </div>
            </TableCell>
            <TableCell v-if="columns.find(c => c.key === 'actions')?.visible" class="text-right">
              <div class="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  @click="confirmBookmark(bookmark.id)"
                >
                  确认
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  @click="ignoreBookmark(bookmark.id)"
                >
                  忽略
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- 分页和统计 -->
    <div class="flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        {{ selectedBookmarks.length }} of {{ bookmarks.length }} row(s) selected.
      </div>
      <div class="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          @click="previousPage"
          :disabled="currentPage === 1"
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          @click="nextPage"
          :disabled="currentPage >= totalPages"
        >
          Next
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ReceivedBookmarkAPI } from '@/services/api'
import type { ReceivedBookmarkResp } from '@/types/api'
import { debounce } from 'lodash-es'

// 数据状态
const bookmarks = ref<ReceivedBookmarkResp[]>([])
const loading = ref(false)
const searchQuery = ref('')
const selectedBookmarks = ref<string[]>([])

// 分页状态
const currentPage = ref(1)
const pageSize = 10

// 列配置
const columns = ref([
  { key: 'name', label: '名称', visible: true },
  { key: 'url', label: '网址', visible: true },
  { key: 'group', label: '建议分组', visible: true },
  { key: 'tags', label: '建议分类', visible: true },
  { key: 'tags2', label: '建议标签', visible: true },
  { key: 'actions', label: '操作', visible: true },
])

// 计算属性
const filteredBookmarks = computed(() => {
  if (!searchQuery.value) return bookmarks.value
  
  const query = searchQuery.value.toLowerCase()
  return bookmarks.value.filter(bookmark => 
    bookmark.name.toLowerCase().includes(query) ||
    bookmark.url.toLowerCase().includes(query) ||
    (bookmark.description && bookmark.description.toLowerCase().includes(query))
  )
})

const paginatedBookmarks = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredBookmarks.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredBookmarks.value.length / pageSize)
})

const isAllSelected = computed(() => {
  if (paginatedBookmarks.value.length === 0) return false
  return paginatedBookmarks.value.every(bookmark => 
    selectedBookmarks.value.includes(bookmark.id)
  )
})

// 获取收到的书签
const fetchBookmarks = async () => {
  try {
    loading.value = true
    const response = await ReceivedBookmarkAPI.getAll({ state: 1 }) // 只获取待确认的
    if (response.code === 0 && response.data) {
      bookmarks.value = response.data
    }
  } catch (error) {
    console.error('获取收件箱失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = debounce(() => {
  currentPage.value = 1
}, 300)

// 切换列显示
const toggleColumn = (key: string, value: boolean) => {
  const column = columns.value.find(c => c.key === key)
  if (column) {
    column.visible = value
  }
}

// 选择处理
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    // 取消选择当前页所有
    paginatedBookmarks.value.forEach(bookmark => {
      const index = selectedBookmarks.value.indexOf(bookmark.id)
      if (index > -1) {
        selectedBookmarks.value.splice(index, 1)
      }
    })
  } else {
    // 选择当前页所有
    paginatedBookmarks.value.forEach(bookmark => {
      if (!selectedBookmarks.value.includes(bookmark.id)) {
        selectedBookmarks.value.push(bookmark.id)
      }
    })
  }
}

const toggleSelectBookmark = (id: string) => {
  const index = selectedBookmarks.value.indexOf(id)
  if (index > -1) {
    selectedBookmarks.value.splice(index, 1)
  } else {
    selectedBookmarks.value.push(id)
  }
}

// 分页处理
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// 书签操作
const confirmBookmark = async (id: string) => {
  try {
    const response = await ReceivedBookmarkAPI.confirm(id)
    if (response.code === 0) {
      // 从列表中移除已确认的书签
      const index = bookmarks.value.findIndex(b => b.id === id)
      if (index > -1) {
        bookmarks.value.splice(index, 1)
      }
      // 从选中列表中移除
      const selectedIndex = selectedBookmarks.value.indexOf(id)
      if (selectedIndex > -1) {
        selectedBookmarks.value.splice(selectedIndex, 1)
      }
    }
  } catch (error) {
    console.error('确认书签失败:', error)
  }
}

const ignoreBookmark = async (id: string) => {
  try {
    const response = await ReceivedBookmarkAPI.delete(id)
    if (response.code === 0) {
      // 从列表中移除已忽略的书签
      const index = bookmarks.value.findIndex(b => b.id === id)
      if (index > -1) {
        bookmarks.value.splice(index, 1)
      }
      // 从选中列表中移除
      const selectedIndex = selectedBookmarks.value.indexOf(id)
      if (selectedIndex > -1) {
        selectedBookmarks.value.splice(selectedIndex, 1)
      }
    }
  } catch (error) {
    console.error('忽略书签失败:', error)
  }
}

// 初始化
onMounted(() => {
  fetchBookmarks()
})
</script>