<script lang="ts">
export const description
    = "A sidebar that collapses to icons."
export const iframeHeight = "800px"
export const containerClass = "w-full h-full"
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from "@/components/Sidebar/AppSidebar.vue"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { SpaceAPI, TagAPI } from '@/services/api'
import type { SpaceResp, TagResp } from '@/types/api'
import DarkModeToggle from '@/components/DarkModeToggle.vue'
import { Button } from '@/components/ui/button'
import { BookOpen } from 'lucide-vue-next'

const route = useRoute()

// 存储空间和标签信息
const currentSpace = ref<SpaceResp | null>(null)
const currentTag = ref<TagResp | null>(null)

// 路由名称映射
const routeNameMap: Record<string, string> = {
  dashboard: '启动台',
  inbox: '收件箱',
  bookmarks: '书签',
  space: '空间',
  tag: '标签'
}

// 获取空间信息
const fetchSpaceInfo = async (id: string) => {
  try {
    const response = await SpaceAPI.getById(id)
    if (response.code === 0 && response.data) {
      currentSpace.value = response.data
    }
  } catch (error) {
    console.error('获取空间信息失败:', error)
  }
}

// 获取标签信息
const fetchTagInfo = async (id: string) => {
  try {
    const response = await TagAPI.getById(id)
    if (response.code === 0 && response.data) {
      currentTag.value = response.data
    }
  } catch (error) {
    console.error('获取标签信息失败:', error)
  }
}

// 监听路由变化
watch(() => route.params, async (params) => {
  if (route.name === 'space' && params.id) {
    await fetchSpaceInfo(params.id as string)
  } else if (route.name === 'tag' && params.id) {
    await fetchTagInfo(params.id as string)
  } else {
    currentSpace.value = null
    currentTag.value = null
  }
}, { immediate: true })

// 计算面包屑标题
const breadcrumbTitle = computed(() => {
  if (route.name === 'space' && currentSpace.value) {
    return currentSpace.value.name
  }
  if (route.name === 'tag' && currentTag.value) {
    return currentTag.value.name
  }
  return routeNameMap[route.name as string] || '页面'
})

// 打开文档页面
const openDocs = () => {
  window.open('https://sinan.host/docs/', '_blank')
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div class="flex items-center justify-between w-full px-4">
          <div class="flex items-center gap-2">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem class="hidden md:block">
                  <BreadcrumbLink href="/">
                    Sinan
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator class="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{{ breadcrumbTitle }}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div class="flex items-center gap-1">
            <Button
              @click="openDocs"
              variant="ghost"
              size="icon"
              class="relative"
              title="查看文档"
            >
              <BookOpen class="h-5 w-5"/>
              <span class="sr-only">查看文档</span>
            </Button>
            <DarkModeToggle />
          </div>
        </div>
      </header>
      <router-view />
    </SidebarInset>
  </SidebarProvider>
</template>
