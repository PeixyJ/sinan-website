<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  TagIcon, Plus,
} from "lucide-vue-next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup, SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagAPI } from '@/services/api'
import type { TagResp, AddTagReq, EditTagReq } from '@/types/api'

interface TagItem {
  id: string
  name: string
  url: string
  color: string
  description: string
}

const tags = ref<TagItem[]>([])
const loading = ref(true)
const router = useRouter()
const { isMobile } = useSidebar()
const currentPage = ref(1)
const PAGE_SIZE = 5
const totalCount = ref(0)
const hasMore = ref(false)

const dialogOpen = ref(false)
const editDialogOpen = ref(false)
const newTag = ref<AddTagReq>({
  name: '',
  color: '#52525b',
  description: ''
})
const editTag = ref<EditTagReq>({
  id: '',
  name: '',
  color: '#52525b',
  description: ''
})
const isSubmitting = ref(false)

const handleAddTag = async () => {
  if (!newTag.value.name.trim()) {
    return
  }
  
  try {
    isSubmitting.value = true
    const response = await TagAPI.create(newTag.value)
    if (response.code === 0) {
      dialogOpen.value = false
      newTag.value = { name: '', color: '#52525b', description: '' }
      await fetchTags()
    }
  } catch (error) {
    console.error('创建标签失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const openEditDialog = (item: TagItem) => {
  editTag.value = {
    id: item.id,
    name: item.name,
    color: item.color || '#52525b',
    description: item.description || ''
  }
  editDialogOpen.value = true
}

const handleEditTag = async () => {
  if (!editTag.value.name?.trim()) {
    return
  }
  
  try {
    isSubmitting.value = true
    const response = await TagAPI.update(editTag.value)
    if (response.code === 0) {
      editDialogOpen.value = false
      await fetchTags()
    }
  } catch (error) {
    console.error('修改标签失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const fetchTags = async (loadMore = false) => {
  try {
    if (!loadMore) {
      loading.value = true
      currentPage.value = 1
      tags.value = []
    }
    
    const response = await TagAPI.getAll({
      page: currentPage.value,
      size: PAGE_SIZE
    })

    if (response.code === 0 && response.data) {
      const newTags = response.data.records.map((tag: TagResp) => ({
        id: tag.id,
        name: tag.name,
        url: `/tag/${tag.id}`,
        color: tag.color,
        description: tag.description
      }))
      
      if (loadMore) {
        tags.value = [...tags.value, ...newTags]
      } else {
        tags.value = newTags
      }
      
      totalCount.value = response.data.total
      hasMore.value = tags.value.length < totalCount.value
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  currentPage.value++
  await fetchTags(true)
}

onMounted(() => {
  fetchTags()
})
</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>标签</SidebarGroupLabel>
    <AlertDialog v-model:open="dialogOpen">
      <AlertDialogTrigger as-child>
        <SidebarGroupAction title="新增标签">
          <Plus/> <span class="sr-only">新增标签</span>
        </SidebarGroupAction>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>新增标签</AlertDialogTitle>
          <AlertDialogDescription>
            创建一个新的标签来组织您的书签
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="tag-name">标签名称</Label>
            <Input 
              id="tag-name" 
              v-model="newTag.name" 
              placeholder="输入标签名称"
              :disabled="isSubmitting"
            />
          </div>
          <div class="space-y-2">
            <Label>标签颜色</Label>
            <div class="flex items-center gap-2">
              <button
                v-for="color in ['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15']"
                :key="color"
                @click="newTag.color = color"
                type="button"
                class="w-8 h-8 rounded-full border-2 transition-all"
                :class="newTag.color === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'"
                :style="{ backgroundColor: color }"
                :disabled="isSubmitting"
              />
              <div class="relative">
                <input
                  type="color"
                  v-model="newTag.color"
                  class="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                  :disabled="isSubmitting"
                />
                <div 
                  class="w-8 h-8 rounded-full border-2 transition-all pointer-events-none overflow-hidden"
                  :class="!['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15'].includes(newTag.color) ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'"
                >
                  <div 
                    class="w-full h-full"
                    :style="{ 
                      background: !['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15'].includes(newTag.color) 
                        ? newTag.color 
                        : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #84cc16, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="space-y-2">
            <Label for="tag-description">描述（可选）</Label>
            <Input 
              id="tag-description" 
              v-model="newTag.description" 
              placeholder="输入标签描述"
              :disabled="isSubmitting"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isSubmitting">取消</AlertDialogCancel>
          <AlertDialogAction 
            @click="handleAddTag"
            :disabled="isSubmitting || !newTag.name.trim()"
          >
            {{ isSubmitting ? '创建中...' : '创建' }}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    <SidebarMenu>
      <div v-if="loading" class="px-2 py-1 text-sm text-muted-foreground">
        加载中...
      </div>
      <div v-else-if="tags.length === 0" class="px-2 py-1 text-sm text-muted-foreground">
        暂无标签
      </div>
      <SidebarMenuItem v-for="item in tags" :key="item.id">
        <SidebarMenuButton @click="() => router.push(item.url)">
          <TagIcon />
          <span>{{ item.name }}</span>
          <div
            class="w-2 h-2 rounded-full ml-auto"
            :style="{ backgroundColor: item.color }"
            v-if="item.color"
          ></div>
        </SidebarMenuButton>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <SidebarMenuAction show-on-hover>
              <MoreHorizontal/>
              <span class="sr-only">更多</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
              class="w-48 rounded-lg"
              :side="isMobile ? 'bottom' : 'right'"
              :align="isMobile ? 'end' : 'start'"
          >
            <DropdownMenuItem @click="openEditDialog(item)">
              <Folder class="text-muted-foreground"/>
              <span>修改标签</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward class="text-muted-foreground"/>
              <span>分享标签</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
              <Trash2 class="text-muted-foreground"/>
              <span>删除标签</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem v-if="hasMore">
        <SidebarMenuButton 
          class="text-sidebar-foreground/70"
          @click="loadMore"
        >
          <MoreHorizontal class="text-sidebar-foreground/70"/>
          <span>更多</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
  
  <!-- 编辑标签对话框 -->
  <AlertDialog v-model:open="editDialogOpen">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>编辑标签</AlertDialogTitle>
        <AlertDialogDescription>
          修改标签的信息
        </AlertDialogDescription>
      </AlertDialogHeader>
      <div class="space-y-4 py-4">
        <div class="space-y-2">
          <Label for="edit-tag-name">标签名称</Label>
          <Input 
            id="edit-tag-name" 
            v-model="editTag.name" 
            placeholder="输入标签名称"
            :disabled="isSubmitting"
          />
        </div>
        <div class="space-y-2">
          <Label>标签颜色</Label>
          <div class="flex items-center gap-2">
            <button
              v-for="color in ['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15']"
              :key="color"
              @click="editTag.color = color"
              type="button"
              class="w-8 h-8 rounded-full border-2 transition-all"
              :class="editTag.color === color ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'"
              :style="{ backgroundColor: color }"
              :disabled="isSubmitting"
            />
            <div class="relative">
              <input
                type="color"
                v-model="editTag.color"
                class="w-8 h-8 rounded-full cursor-pointer opacity-0 absolute inset-0"
                :disabled="isSubmitting"
              />
              <div 
                class="w-8 h-8 rounded-full border-2 transition-all pointer-events-none overflow-hidden"
                :class="!['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15'].includes(editTag.color) ? 'border-gray-900 dark:border-gray-100 scale-110' : 'border-transparent'"
              >
                <div 
                  class="w-full h-full"
                  :style="{ 
                    background: !['#52525b', '#e11d48', '#22c55e', '#3b82f6', '#facc15'].includes(editTag.color) 
                      ? editTag.color 
                      : 'conic-gradient(from 0deg, #ef4444, #f59e0b, #eab308, #84cc16, #22c55e, #06b6d4, #3b82f6, #8b5cf6, #ec4899, #ef4444)'
                  }"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <Label for="edit-tag-description">描述（可选）</Label>
          <Input 
            id="edit-tag-description" 
            v-model="editTag.description" 
            placeholder="输入标签描述"
            :disabled="isSubmitting"
          />
        </div>
      </div>
      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isSubmitting">取消</AlertDialogCancel>
        <AlertDialogAction 
          @click="handleEditTag"
          :disabled="isSubmitting || !editTag.name?.trim()"
        >
          {{ isSubmitting ? '保存中...' : '保存' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
