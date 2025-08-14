<script setup lang="ts">
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  TagIcon,
} from "lucide-vue-next"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { TagAPI } from '@/services/api'
import type { TagResp } from '@/types/api'

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

const fetchTags = async () => {
  try {
    loading.value = true
    const response = await TagAPI.getAll()

    if (response.data.code === 0 && response.data.data) {
      tags.value = response.data.data.records.map((tag: TagResp) => ({
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
