<script setup lang="ts">
import type {SidebarProps} from '@/components/ui/sidebar'

import {
  BookOpen,
  Bot,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-vue-next"
import NavSpace from '@/components/Sidebar/NavSpace.vue'
import NavTag from '@/components/Sidebar/NavTag.vue'
import NavUser from '@/components/Sidebar/NavUser.vue'
import TeamSwitcher from '@/components/Sidebar/TeamSwitcher.vue'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import NavIndex from "@/components/Sidebar/NavIndex.vue";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Sinan",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "/playground",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "/playground/history",
        },
        {
          title: "Starred",
          url: "/playground/starred",
        },
        {
          title: "Settings",
          url: "/playground/settings",
        },
      ],
    },
    {
      title: "Models",
      url: "/models",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "/models/genesis",
        },
        {
          title: "Explorer",
          url: "/models/explorer",
        },
        {
          title: "Quantum",
          url: "/models/quantum",
        },
      ],
    },
    {
      title: "Documentation",
      url: "/docs",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "/docs/introduction",
        },
        {
          title: "Get Started",
          url: "/docs/get-started",
        },
        {
          title: "Tutorials",
          url: "/docs/tutorials",
        },
        {
          title: "Changelog",
          url: "/docs/changelog",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "/settings/general",
        },
        {
          title: "Team",
          url: "/settings/team",
        },
        {
          title: "Billing",
          url: "/settings/billing",
        },
        {
          title: "Limits",
          url: "/settings/limits",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "/projects/design-engineering",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "/projects/sales-marketing",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "/projects/travel",
      icon: Map,
    },
  ],
}
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <TeamSwitcher :teams="data.teams"/>
    </SidebarHeader>
    <SidebarContent>
      <NavIndex/>
      <NavSpace :items="data.navMain"/>
      <NavTag :projects="data.projects"/>
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user"/>
    </SidebarFooter>
    <SidebarRail/>
  </Sidebar>
</template>
