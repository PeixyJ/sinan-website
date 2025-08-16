<script setup lang="ts">
import {ref, onMounted} from "vue"
import {useRouter} from "vue-router"
import {Plus} from "lucide-vue-next"

import {
  SidebarGroup, SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu, SidebarMenuAction,
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
import IconPicker from '@/components/Base/IconPicker.vue'
import {SpaceAPI} from '@/services/api'
import type {SpaceResp, AddSpaceReq} from '@/types/api'
import Icon from "@/components/Base/Icon.vue";
import {Folder, Forward, MoreHorizontal, Trash2} from "lucide-vue-next";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface SpaceItem {
  title: string
  url: string
  icon?: string  // 修改为 string 类型，因为使用的是图标名称字符串
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

const spaces = ref<SpaceItem[]>([])
const loading = ref(true)
const router = useRouter()
const { isMobile } = useSidebar()

const dialogOpen = ref(false)
const newSpace = ref<AddSpaceReq>({
  name: '',
  icon: '',
  description: '',
  sort: 0
})
const isSubmitting = ref(false)

const handleAddSpace = async () => {
  if (!newSpace.value.name.trim()) {
    return
  }
  
  try {
    isSubmitting.value = true
    const response = await SpaceAPI.create(newSpace.value)
    if (response.code === 0) {
      dialogOpen.value = false
      newSpace.value = { name: '', icon: '', description: '', sort: 0 }
      await fetchSpaces()
    }
  } catch (error) {
    console.error('创建空间失败:', error)
  } finally {
    isSubmitting.value = false
  }
}

const fetchSpaces = async () => {
  try {
    loading.value = true
    const response = await SpaceAPI.getAll()
    if (response.code === 0 && response.data.records) {
      spaces.value = response.data.records
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map((space: SpaceResp) => ({
            title: space.name,
            url: `/space/${space.id}`,
            icon: space.icon,
            isActive: false,
            items: []
          }))
    }
  } catch (error) {
    console.error('获取空间列表失败:', error)
  } finally {
    loading.value = false
  }
}


onMounted(() => {
  fetchSpaces()
})
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>
      空间
    </SidebarGroupLabel>
    <AlertDialog v-model:open="dialogOpen">
      <AlertDialogTrigger as-child>
        <SidebarGroupAction title="新增空间">
          <Plus/> <span class="sr-only">新增空间</span>
        </SidebarGroupAction>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>新增空间</AlertDialogTitle>
          <AlertDialogDescription>
            创建一个新的空间来组织您的书签
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="space-name">名称</Label>
            <Input 
              id="space-name" 
              v-model="newSpace.name" 
              placeholder="输入空间名称"
              :disabled="isSubmitting"
            />
          </div>
          <div class="space-y-2">
            <Label for="space-icon">图标</Label>
            <IconPicker
              v-model="newSpace.icon"
              placeholder="选择图标"
              :disabled="isSubmitting"
            />
          </div>
          <div class="space-y-2">
            <Label for="space-description">描述</Label>
            <Input 
              id="space-description" 
              v-model="newSpace.description" 
              placeholder="输入空间描述"
              :disabled="isSubmitting"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel :disabled="isSubmitting">取消</AlertDialogCancel>
          <AlertDialogAction 
            @click="handleAddSpace"
            :disabled="isSubmitting || !newSpace.name.trim()"
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
      <div v-else-if="spaces.length === 0" class="px-2 py-1 text-sm text-muted-foreground">
        暂无空间
      </div>
      <SidebarMenuItem v-for="item in spaces" :key="item.title">
        <SidebarMenuButton :tooltip="item.title" @click="() => router.push(item.url)">
          <Icon :name="item.icon" v-if="item.icon"/>
          <span>{{ item.title }}</span>
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
              <span>修改空间</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Forward class="text-muted-foreground"/>
              <span>分享空间</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem>
              <Trash2 class="text-muted-foreground"/>
              <span>删除空间</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton class="text-sidebar-foreground/70">
          <MoreHorizontal class="text-sidebar-foreground/70"/>
          <span>More</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
