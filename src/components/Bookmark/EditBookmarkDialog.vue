<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>编辑书签</DialogTitle>
        <DialogDescription>
          修改书签的信息和标签
        </DialogDescription>
      </DialogHeader>
      <div class="grid gap-4 py-4">
        <div class="space-y-2">
          <Label for="edit-name">名称</Label>
          <Input
            id="edit-name"
            v-model="formData.name"
            placeholder="输入书签名称"
          />
        </div>
        <div class="space-y-2">
          <Label for="edit-url">网址</Label>
          <Input
            id="edit-url"
            v-model="formData.url"
            placeholder="输入书签网址"
          />
        </div>
        <div class="space-y-2">
          <Label for="edit-description">描述</Label>
          <Input
            id="edit-description"
            v-model="formData.description"
            placeholder="输入书签描述（可选）"
          />
        </div>
        <div class="space-y-2">
          <Label for="edit-icon">图标</Label>
          <div class="space-y-2">
            <div class="flex gap-2">
              <Input
                id="edit-icon"
                v-model="formData.icon"
                placeholder="输入图标 URL 或 base64 数据（可选）"
                :class="iconValidationClass"
                class="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                @click="triggerFileUpload"
                :disabled="isUploading"
                class="flex-shrink-0 h-9 px-3"
              >
                <Upload class="h-4 w-4" />
                {{ isUploading ? '上传中...' : '上传' }}
              </Button>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleFileUpload"
            />
            <div v-if="uploadError" class="text-sm text-red-600">
              {{ uploadError }}
            </div>
            <div v-if="iconValidationMessage" class="text-sm" :class="isIconValid ? 'text-green-600' : 'text-red-600'">
              {{ iconValidationMessage }}
            </div>
            <!-- 图标预览 -->
            <div v-if="isIconValid && formData.icon" class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">预览:</span>
              <div class="flex h-6 w-6 items-center justify-center rounded bg-muted overflow-hidden">
                <img
                  :src="formData.icon"
                  alt="Icon preview"
                  class="h-full w-full object-cover"
                  @error="onIconError"
                />
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <Label>所属空间</Label>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="space in availableSpaces"
              :key="space.id"
              @click="selectedSpaceId = space.id"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors"
              :class="selectedSpaceId === space.id 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-muted'"
            >
              <Icon v-if="space.icon" :name="space.icon" :size="16" />
              <span class="text-sm">{{ space.name }}</span>
            </div>
            <div
              @click="selectedSpaceId = ''"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors"
              :class="selectedSpaceId === '' 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-muted'"
            >
              <span class="text-sm">无空间</span>
            </div>
            <div v-if="availableSpaces.length === 0" class="text-sm text-muted-foreground">
              暂无可用空间
            </div>
          </div>
        </div>
        <div class="space-y-2">
          <Label>标签</Label>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="tag in availableTags"
              :key="tag.id"
              @click="toggleTag(tag.id)"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-md border cursor-pointer transition-colors"
              :class="selectedTagIds.includes(tag.id) 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'hover:bg-muted'"
            >
              <div 
                class="h-2 w-2 rounded-full" 
                :style="{ backgroundColor: tag.color || '#52525b' }"
              />
              <span class="text-sm">{{ tag.name }}</span>
            </div>
            <div v-if="availableTags.length === 0" class="text-sm text-muted-foreground">
              暂无可用标签
            </div>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="handleCancel">
          取消
        </Button>
        <Button @click="handleSave" :disabled="isSubmitting || !formData.name || !formData.url">
          {{ isSubmitting ? '保存中...' : '保存' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-vue-next'
import Icon from '@/components/Base/Icon.vue'
import { BookmarkAPI, TagAPI, SpaceAPI } from '@/services/api'
import type { BookmarkResp, TagResp, SpaceRespSimple, EditBookmarkReq } from '@/types/api'
import { eventBus, EVENTS } from '@/utils/eventBus'

interface Props {
  open: boolean
  bookmark: BookmarkResp | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const formData = ref<EditBookmarkReq>({
  id: '',
  name: '',
  url: '',
  description: '',
  icon: '',
  tags: []
})

const selectedTagIds = ref<string[]>([])
const availableTags = ref<TagResp[]>([])
const availableSpaces = ref<SpaceRespSimple[]>([])
const selectedSpaceId = ref<string>('')
const isSubmitting = ref(false)
const iconLoadError = ref(false)
const isUploading = ref(false)
const uploadError = ref('')
const fileInput = ref<HTMLInputElement>()

// Icon validation logic
const isIconValid = computed(() => {
  if (!formData.value.icon || formData.value.icon.trim() === '') return true // 空值是有效的
  const icon = formData.value.icon.trim()
  // 检查是否为 HTTP/HTTPS URL
  if (icon.startsWith('http://') || icon.startsWith('https://')) return !iconLoadError.value
  // 检查是否为 base64 图片
  if (icon.startsWith('data:image/')) return !iconLoadError.value
  return false
})

const iconValidationMessage = computed(() => {
  if (!formData.value.icon || formData.value.icon.trim() === '') return ''
  const icon = formData.value.icon.trim()
  
  if (iconLoadError.value) return '图标加载失败，请检查 URL 或 base64 数据'
  
  if (icon.startsWith('http://') || icon.startsWith('https://')) {
    return '✓ 有效的图标 URL'
  }
  if (icon.startsWith('data:image/')) {
    return '✓ 有效的 base64 图片数据'
  }
  return '请输入有效的图标 URL (http/https) 或 base64 图片数据'
})

const iconValidationClass = computed(() => {
  if (!formData.value.icon || formData.value.icon.trim() === '') return ''
  return isIconValid.value ? 'border-green-500' : 'border-red-500'
})

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAllList()
    availableTags.value = response.data || []
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 获取所有空间
const fetchSpaces = async () => {
  try {
    const response = await SpaceAPI.getAllList()
    availableSpaces.value = response.data.records || response.data
  } catch (error) {
    console.error('Failed to fetch spaces:', error)
  }
}

// 图标加载错误处理
const onIconError = () => {
  iconLoadError.value = true
}

// 监听图标变化，重置错误状态
watch(() => formData.value.icon, () => {
  iconLoadError.value = false
  uploadError.value = ''
})

// 触发文件上传
const triggerFileUpload = () => {
  fileInput.value?.click()
}

// 处理文件上传
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // 验证文件类型
  if (!file.type.startsWith('image/')) {
    uploadError.value = '请选择图片文件'
    return
  }
  
  // 验证文件大小（限制为 5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    uploadError.value = '图片文件大小不能超过 5MB'
    return
  }
  
  try {
    isUploading.value = true
    uploadError.value = ''
    
    const response = await BookmarkAPI.uploadIcon(file)
    
    if (response.code === 0 && response.data) {
      // 上传成功，设置图标 URL
      formData.value.icon = response.data
      iconLoadError.value = false
    } else {
      uploadError.value = response.message || '上传失败'
    }
  } catch (error: any) {
    console.error('Icon upload failed:', error)
    uploadError.value = error.response?.data?.message || '上传失败，请稍后重试'
  } finally {
    isUploading.value = false
    // 清除文件选择，允许重复选择同一文件
    if (target) target.value = ''
  }
}

// 切换标签选择
const toggleTag = (tagId: string) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

// 处理保存
const handleSave = async () => {
  if (!formData.value.name || !formData.value.url) return
  
  try {
    isSubmitting.value = true
    
    // 过滤掉 null 和 undefined 的标签ID
    const validTagIds = selectedTagIds.value.filter(id => id != null && id !== '')
    
    const updateData = {
      id: formData.value.id,
      name: formData.value.name,
      url: formData.value.url,
      description: formData.value.description || '',
      icon: formData.value.icon?.trim() || undefined,
      namespaceId: selectedSpaceId.value || undefined,
      tags: validTagIds.length > 0 ? validTagIds : undefined
    }
    
    console.log('Update data:', updateData)
    
    const response = await BookmarkAPI.update(updateData) as any
    
    console.log('Update response:', response)
    
    // 检查多种可能的成功响应格式
    if (response?.flag || response?.code === 0 || response?.data) {
      emit('success')
      isOpen.value = false
    } else {
      console.error('Failed to update bookmark:', response)
      // 如果有具体的错误信息，可以显示给用户
      alert(response?.message || '更新书签失败')
    }
  } catch (error) {
    console.error('Failed to update bookmark:', error)
    alert('更新书签时发生错误')
  } finally {
    isSubmitting.value = false
  }
}

// 处理取消
const handleCancel = () => {
  isOpen.value = false
}

// 监听书签变化，初始化表单
watch(() => props.bookmark, (newBookmark) => {
  if (newBookmark) {
    formData.value = {
      id: newBookmark.id,
      name: newBookmark.name || '',
      url: newBookmark.url || '',
      description: newBookmark.description || '',
      icon: String(newBookmark.icon || ''),
      namespaceId: newBookmark.spaceId || '',
      tags: []
    }
    // 过滤掉可能的 null 或 undefined 标签ID
    selectedTagIds.value = newBookmark.tags
      ?.map(tag => tag.id)
      ?.filter(id => id != null && id !== '') || []
    // 设置选中的空间
    selectedSpaceId.value = newBookmark.spaceId || ''
    // 重置图标错误状态
    iconLoadError.value = false
    uploadError.value = ''
  }
}, { immediate: true })

// 组件挂载时获取标签和空间
watch(isOpen, (newValue) => {
  if (newValue) {
    fetchTags()
    fetchSpaces()
  }
})

// 监听标签刷新事件
const handleRefreshTags = () => {
  fetchTags()
}

onMounted(() => {
  // 监听标签列表刷新事件
  eventBus.on(EVENTS.REFRESH_TAGS, handleRefreshTags)
})

onUnmounted(() => {
  // 清理事件监听器
  eventBus.off(EVENTS.REFRESH_TAGS, handleRefreshTags)
})
</script>