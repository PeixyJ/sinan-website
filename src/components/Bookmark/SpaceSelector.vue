<template>
  <div ref="containerRef" class="w-full">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          role="combobox"
          :aria-expanded="open"
          class="w-full justify-between"
        >
          <span v-if="selectedSpace" class="flex items-center">
            <Icon v-if="selectedSpace.icon" :name="selectedSpace.icon" class="mr-2 h-4 w-4" />
            {{ selectedSpace.name }}
          </span>
          <span v-else class="text-muted-foreground">选择空间（可选）</span>
          <ChevronsUpDown class="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        class="p-0" 
        align="start"
        :style="{ width: contentWidth }"
      >
        <div class="flex flex-col max-h-[300px]">
        <!-- 搜索框 -->
        <div class="flex items-center border-b px-3 pb-2 pt-3">
          <Search class="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            v-model="searchQuery"
            placeholder="搜索空间..."
            class="h-8 w-full border-0 bg-transparent p-0 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 px-2"
            @input="handleSearch"
          />
        </div>
        
        <!-- 空间列表 -->
        <div class="overflow-y-auto flex-1 p-1">
          <div v-if="loading" class="py-6 text-center text-sm text-muted-foreground">
            加载中...
          </div>
          <div v-else-if="spaces.length === 0" class="py-6 text-center text-sm text-muted-foreground">
            {{ searchQuery ? '没有找到匹配的空间' : '暂无空间' }}
          </div>
          <button
            v-for="space in spaces"
            :key="space.id"
            @click="selectSpace(space)"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
            :class="modelValue === space.id ? 'bg-accent text-accent-foreground' : ''"
          >
            <Icon v-if="space.icon" :name="space.icon" class="mr-2 h-4 w-4" />
            <span>{{ space.name }}</span>
            <Check 
              v-if="modelValue === space.id"
              class="ml-auto h-4 w-4" 
            />
          </button>
          
          <!-- 加载更多按钮 -->
          <button
            v-if="hasMore"
            @click="loadMore"
            class="relative flex w-full cursor-pointer select-none items-center justify-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <MoreHorizontal class="mr-2 h-4 w-4" />
            <span>加载更多</span>
          </button>
        </div>
        
        <!-- 清除选择按钮 -->
        <div v-if="modelValue" class="border-t p-1">
          <button
            @click="clearSelection"
            class="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
          >
            <X class="mr-2 h-4 w-4" />
            <span>清除选择</span>
          </button>
        </div>
      </div>
    </PopoverContent>
  </Popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { Check, ChevronsUpDown, Search, MoreHorizontal, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import Icon from '@/components/Base/Icon.vue'
import { SpaceAPI } from '@/services/api'
import type { SpaceResp } from '@/types/api'
import { debounce } from 'lodash-es'

interface Props {
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

const containerRef = ref<HTMLElement>()
const contentWidth = ref('100%')
const open = ref(false)
const spaces = ref<SpaceResp[]>([])
const loading = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const PAGE_SIZE = 10
const totalCount = ref(0)
const hasMore = ref(false)

const selectedSpace = computed(() => {
  if (!props.modelValue) return null
  return spaces.value.find(s => s.id === props.modelValue)
})

const fetchSpaces = async (reset = false) => {
  try {
    if (reset) {
      currentPage.value = 1
      spaces.value = []
    }
    
    loading.value = true
    const response = await SpaceAPI.getAll({
      page: currentPage.value,
      size: PAGE_SIZE,
      search: searchQuery.value || undefined
    })
    
    if (response.code === 0 && response.data) {
      const newSpaces = response.data.records || []
      
      if (reset) {
        spaces.value = newSpaces
      } else {
        spaces.value = [...spaces.value, ...newSpaces]
      }
      
      totalCount.value = response.data.total
      hasMore.value = spaces.value.length < totalCount.value
    }
  } catch (error) {
    console.error('获取空间列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  currentPage.value++
  await fetchSpaces(false)
}

const handleSearch = debounce(() => {
  fetchSpaces(true)
}, 300)

const selectSpace = (space: SpaceResp) => {
  emit('update:modelValue', space.id)
  open.value = false
}

const clearSelection = () => {
  emit('update:modelValue', undefined)
  open.value = false
}

// 监听打开状态，首次打开时加载数据并更新宽度
watch(open, async (newValue) => {
  if (newValue) {
    // 更新宽度
    await nextTick()
    if (containerRef.value) {
      contentWidth.value = `${containerRef.value.offsetWidth}px`
    }
    // 加载数据
    if (spaces.value.length === 0) {
      fetchSpaces(true)
    }
  }
})

// 监听搜索词变化
watch(searchQuery, () => {
  currentPage.value = 1
})

onMounted(() => {
  // 如果有默认值，加载数据以显示选中的空间名称
  if (props.modelValue) {
    fetchSpaces(true)
  }
})
</script>