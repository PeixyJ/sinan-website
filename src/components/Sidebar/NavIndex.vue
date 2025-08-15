<script setup lang="ts">
import {Bookmark, Frame, Inbox, LayoutGrid} from "lucide-vue-next"
import { RouterLink } from 'vue-router'

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

</script>

<template>
  <SidebarGroup class="group-data-[collapsible=icon]:hidden">
    <SidebarGroupLabel>常规</SidebarGroupLabel>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton as-child>
          <RouterLink to="/dashboard">
            <component :is="LayoutGrid"/>
            <span>启动台</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton as-child>
          <RouterLink to="/inbox">
            <component :is="Inbox"/>
            <span>收件箱</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton as-child>
          <RouterLink to="/bookmarks">
            <component :is="Bookmark"/>
            <span>游离书签</span>
          </RouterLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
