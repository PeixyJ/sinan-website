<script setup lang="ts">
import {ref, computed, watch} from 'vue'
import * as Icons from 'lucide-vue-next'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Button} from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'

interface IconPickerProps {
  modelValue?: string
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<IconPickerProps>(), {
  modelValue: '',
  placeholder: '选择图标',
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

// 常用图标分类 - 静态定义，在获取时验证
const iconCategories: Record<string, string[]> = {
  common: [
    'Home', 'User', 'Users', 'Search', 'Settings', 'Mail', 'Calendar',
    'Clock', 'Bell', 'Heart', 'Star', 'Flag', 'Bookmark', 'Archive',
    'Trash2', 'Edit', 'Copy', 'Save', 'Download', 'Upload', 'Share2',
    'Link', 'Paperclip', 'Eye', 'EyeOff', 'Lock', 'Unlock', 'Key'
  ],
  files: [
    'Folder', 'FolderOpen', 'FolderPlus', 'FolderMinus', 'FolderX',
    'Folders', 'FolderTree', 'FolderClosed', 'FolderDot', 'FolderCheck',
    'File', 'FileText', 'FilePlus', 'FileMinus', 'FileX', 'FileCode',
    'FileJson', 'FileArchive', 'FileAudio', 'FileVideo', 'FileImage'
  ],
  media: [
    'Play', 'Pause', 'PlayCircle', 'PauseCircle', 'StopCircle',
    'SkipForward', 'SkipBack', 'FastForward', 'Rewind', 'Volume2',
    'VolumeX', 'Volume1', 'Volume', 'Mic', 'MicOff', 'Camera', 'CameraOff'
  ],
  business: [
    'Briefcase', 'Building', 'Building2', 'Store', 'ShoppingCart',
    'ShoppingBag', 'Package', 'Package2', 'CreditCard', 'DollarSign',
    'Receipt', 'BarChart', 'LineChart', 'PieChart', 'TrendingUp'
  ],
  nature: [
    'Sun', 'Moon', 'Cloud', 'CloudRain', 'CloudSnow', 'Wind', 'Zap',
    'Flower', 'Trees', 'Mountain', 'Waves', 'Droplet', 'Flame'
  ],
  tech: [
    'MessageSquare', 'MessageCircle', 'Mail', 'Send', 'Phone', 'PhoneCall',
    'PhoneOff', 'Video', 'VideoOff', 'Wifi', 'WifiOff', 'Radio',
    'Monitor', 'Laptop', 'Smartphone', 'Tablet', 'Watch', 'Cpu',
    'HardDrive', 'Database', 'Server', 'Bluetooth', 'Github',
    'Terminal', 'Code', 'Code2', 'Binary', 'Bug', 'GitBranch'
  ],
  shapes: [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUpRight',
    'ArrowDownRight', 'ArrowDownLeft', 'ArrowUpLeft', 'ChevronsUp',
    'ChevronsDown', 'ChevronsLeft', 'ChevronsRight',
    'Circle', 'Square', 'Triangle', 'Hexagon', 'Octagon', 'Star',
    'Heart', 'Diamond', 'Pentagon', 'Box', 'Cylinder', 'Cube'
  ]
}

const open = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('common')
const selectedIcon = ref(props.modelValue || '')

// 缓存有效的图标组件
const validIconsCache = new Map<string, any>()

// 获取所有可用的图标名称 - 添加更严格的过滤
const allIconNames = computed(() => {
  return Object.keys(Icons).filter(name => {
    // 排除非图标的导出
    if (name === 'default' ||
        name === 'Icon' ||
        name.startsWith('Lucide')) {
      return false
    }
    // 确保是有效的组件函数
    const icon = (Icons as any)[name]
    return icon && typeof icon === 'function'
  })
})

// 根据搜索和分类过滤图标
const filteredIcons = computed(() => {
  let icons: string[] = []
  if (searchQuery.value) {
    icons = allIconNames.value.filter(name =>
        name.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  } else if (selectedCategory.value === 'all') {
    console.log("到我这边了！！！")
    icons = allIconNames.value
  } else {
    icons = iconCategories[selectedCategory.value] || []
  }

  // 再次过滤，确保所有图标都是有效的
  return icons.filter(name => {
    const icon = (Icons as any)[name]
    return icon && typeof icon === 'function'
  })
})

// 获取图标组件 - 添加安全检查和缓存
const getIconComponent = (name: string) => {
  // 先检查缓存
  if (validIconsCache.has(name)) {
    return validIconsCache.get(name)
  }

  try {
    const icon = (Icons as any)[name]
    // 确保返回的是有效的组件
    if (icon && typeof icon === 'function') {
      validIconsCache.set(name, icon)
      return icon
    }
  } catch (error) {
    console.warn(`Failed to load icon: ${name}`, error)
  }

  // 缓存无效的图标为 null，避免重复检查
  validIconsCache.set(name, null)
  return null
}

// 选择图标
const selectIcon = (iconName: string) => {
  selectedIcon.value = iconName
  emit('update:modelValue', iconName)
  open.value = false
  searchQuery.value = ''
}

// 清除选择
const clearSelection = () => {
  selectedIcon.value = ''
  emit('update:modelValue', '')
}

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectedIcon.value = newValue || ''
})

// 当前选中的图标组件 - 添加安全检查
const CurrentIcon = computed(() => {
  if (selectedIcon.value) {
    const icon = Icons[selectedIcon.value as keyof typeof Icons]
    // 确保是有效的组件
    return icon && typeof icon === 'function' ? icon : null
  }
  return null
})
</script>

<template>
  <div class="space-y-2">
    <Popover v-model:open="open">
      <PopoverTrigger as-child>
        <Button
            variant="outline"
            role="combobox"
            :aria-expanded="open"
            :disabled="disabled"
            class="w-full justify-between"
        >
          <div class="flex items-center gap-2">
            <component
                v-if="CurrentIcon"
                :is="CurrentIcon"
                class="h-4 w-4"
            />
            <span v-if="selectedIcon">{{ selectedIcon }}</span>
            <span v-else class="text-muted-foreground">{{ placeholder }}</span>
          </div>
          <Icons.ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50"/>
        </Button>
      </PopoverTrigger>
      <PopoverContent class="w-[400px] p-0" align="start">
        <div class="p-4 pb-2">
          <Input
              v-model="searchQuery"
              placeholder="搜索图标..."
              class="h-9"
          />
        </div>

        <Tabs v-model="selectedCategory" class="w-full">
          <TabsList class="w-full flex-wrap h-auto p-1 mx-4" style="width: calc(100% - 2rem);">
            <TabsTrigger value="common" class="text-xs">常用</TabsTrigger>
            <TabsTrigger value="files" class="text-xs">文件</TabsTrigger>
            <TabsTrigger value="media" class="text-xs">媒体</TabsTrigger>
            <TabsTrigger value="business" class="text-xs">商务</TabsTrigger>
            <TabsTrigger value="nature" class="text-xs">自然</TabsTrigger>
            <TabsTrigger value="tech" class="text-xs">科技</TabsTrigger>
            <TabsTrigger value="shapes" class="text-xs">形状</TabsTrigger>
            <TabsTrigger value="all" class="text-xs">全部</TabsTrigger>
          </TabsList>

          <TabsContent
              v-for="category in ['common', 'folders', 'files', 'arrows', 'media', 'communication', 'business', 'nature', 'tech', 'shapes', 'all']"
              :key="category"
              :value="category"
              class="m-0 p-0"
          >
            <ScrollArea class="h-[150px] p-4">
              <div class="grid grid-cols-8 gap-2">
                <template v-for="iconName in filteredIcons" :key="iconName">
                  <button
                      v-if="getIconComponent(iconName)"
                      @click="selectIcon(iconName)"
                      class="flex flex-col items-center justify-center p-2 rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                      :class="{ 'bg-accent text-accent-foreground': selectedIcon === iconName }"
                      :title="iconName"
                  >
                    <div class="h-5 w-5 mb-1">
                      <component
                          v-if="getIconComponent(iconName)"
                          :is="getIconComponent(iconName)"
                          class="h-5 w-5"
                      />
                    </div>
                    <span class="text-[10px] truncate w-full text-center">
                      {{ iconName.slice(0, 8) }}
                    </span>
                  </button>
                </template>
              </div>

              <div v-if="filteredIcons.length === 0" class="text-center py-6 text-muted-foreground">
                没有找到匹配的图标
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div class="flex items-center justify-between p-4 pt-2 border-t">
          <Button
              v-if="selectedIcon"
              @click="clearSelection"
              variant="ghost"
              size="sm"
          >
            清除选择
          </Button>
          <div v-else></div>
          <Button
              @click="open = false"
              variant="outline"
              size="sm"
          >
            关闭
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>
</template>