<script setup lang="ts">
import {ref, onMounted} from "vue"
import {useRouter} from "vue-router"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu, SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {SpaceAPI} from '@/services/api'
import type {SpaceResp} from '@/types/api'
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
    <SidebarGroupLabel>空间</SidebarGroupLabel>
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
