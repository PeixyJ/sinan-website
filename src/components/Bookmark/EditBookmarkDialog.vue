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
import { ref, watch, computed } from 'vue'
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
import { BookmarkAPI, TagAPI } from '@/services/api'
import type { BookmarkResp, TagResp, EditBookmarkReq } from '@/types/api'

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
  tags: []
})

const selectedTagIds = ref<string[]>([])
const availableTags = ref<TagResp[]>([])
const isSubmitting = ref(false)

// 获取所有标签
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAll() as any
    if (response?.code === 0 && response?.data) {
      availableTags.value = response.data.records || []
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
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
      namespaceId: formData.value.namespaceId || undefined,
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
      namespaceId: newBookmark.namespaceId || '',
      tags: []
    }
    // 过滤掉可能的 null 或 undefined 标签ID
    selectedTagIds.value = newBookmark.tags
      ?.map(tag => tag.id)
      ?.filter(id => id != null && id !== '') || []
  }
}, { immediate: true })

// 组件挂载时获取标签
watch(isOpen, (newValue) => {
  if (newValue) {
    fetchTags()
  }
})
</script>