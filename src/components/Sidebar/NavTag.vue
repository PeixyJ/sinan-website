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
import type { TagResp, AddTagReq } from '@/types/api'

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

const dialogOpen = ref(false)
const newTag = ref<AddTagReq>({
  name: '',
  color: '#3B82F6',
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
      newTag.value = { name: '', color: '#3B82F6', description: '' }
      await fetchTags()
    }
  } catch (error) {
    console.error('创建标签失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const fetchTags = async () => {
  try {
    loading.value = true
    const response = await TagAPI.getAll()

    if (response.code === 0 && response.data) {
      tags.value = response.data.records.map((tag: TagResp) => ({
        id: tag.id,
        name: tag.name,
        url: `/tag/${tag.id}`,
        color: tag.color,
        description: tag.description
      }))
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    loading.value = false
  }
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
            <Label for="tag-color">标签颜色</Label>
            <div class="flex items-center gap-2">
              <Input 
                id="tag-color" 
                type="color"
                v-model="newTag.color" 
                class="w-20 h-10"
                :disabled="isSubmitting"
              />
              <Input 
                v-model="newTag.color" 
                placeholder="#3B82F6"
                :disabled="isSubmitting"
              />
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
            <DropdownMenuItem>
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
      <SidebarMenuItem>
        <SidebarMenuButton class="text-sidebar-foreground/70">
          <MoreHorizontal class="text-sidebar-foreground/70"/>
          <span>更多</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
