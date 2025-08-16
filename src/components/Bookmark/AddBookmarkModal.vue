<template>
  <AlertDialog v-model:open="isOpen">
    <AlertDialogContent class="sm:max-w-md">
      <AlertDialogHeader>
        <AlertDialogTitle>添加书签</AlertDialogTitle>
        <AlertDialogDescription>
          填写以下信息来添加新书签
        </AlertDialogDescription>
      </AlertDialogHeader>

      <form @submit.prevent="handleSubmit" class="grid gap-4 p-4">
        <!-- 名称 -->
        <div class="grid gap-2">
          <Label for="name">名称 *</Label>
          <Input
              id="name"
              v-model="form.name"
              placeholder="请输入书签名称"
              required
          />
        </div>

        <!-- URL -->
        <div class="grid gap-2">
          <Label for="url">网址 *</Label>
          <Input
              id="url"
              v-model="form.url"
              type="url"
              placeholder="https://example.com"
              required
          />
        </div>

        <!-- 描述 -->
        <div class="grid gap-2">
          <Label for="description">描述</Label>
          <Input
              id="description"
              v-model="form.description"
              placeholder="请输入书签描述（可选）"
          />
        </div>

        <!-- 空间选择 -->
        <div class="grid gap-2">
          <Label for="space">空间</Label>
          <SpaceSelector v-model="form.namespaceId" />
        </div>

        <!-- 标签选择 -->
        <div class="grid gap-2">
          <Label>标签</Label>
          <div class="space-y-2">
            <!-- 已选标签显示 -->
            <div v-if="selectedTags.length > 0" class="flex flex-wrap gap-2">
              <div
                v-for="tagId in selectedTags"
                :key="tagId"
                class="inline-flex items-center gap-2 px-2 py-1 text-xs bg-secondary text-secondary-foreground rounded-md"
              >
                <div 
                  class="w-2 h-2 rounded-full"
                  :style="{ backgroundColor: getTagColor(tagId) }"
                ></div>
                <span>{{ getTagName(tagId) }}</span>
                <button
                  @click="removeTag(tagId)"
                  class="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  type="button"
                >
                  <svg class="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- 标签选择下拉框 -->
            <Select v-model="selectedTagToAdd" @update:model-value="handleTagSelect">
              <SelectTrigger class="w-full">
                <SelectValue placeholder="选择或搜索标签..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="tag in availableTags"
                  :key="tag.id"
                  :value="tag.id"
                >
                  <div class="flex items-center gap-2">
                    <div 
                      class="w-2 h-2 rounded-full"
                      :style="{ backgroundColor: getTagColor(tag.id) }"
                    ></div>
                    <span>{{ tag.name }}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </form>

      <AlertDialogFooter class="flex gap-2">
        <AlertDialogCancel @click="handleCancel">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
            @click="handleSubmit"
            :disabled="isSubmitting || !form.name.trim() || !form.url.trim()"
        >
          <span v-if="isSubmitting" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
          {{ isSubmitting ? '添加中...' : '确认添加' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import {ref, watch, computed} from 'vue'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import SpaceSelector from './SpaceSelector.vue'
import {BookmarkAPI, TagAPI} from '@/services/api'
import type {AddBookmarkReq, TagResp} from '@/types/api'

// Props
interface Props {
  open: boolean
  defaultSpaceId?: string
  defaultTagIds?: string[]
}

// Emits
interface Emits {
  (e: 'update:open', value: boolean): void

  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const isOpen = ref(props.open)
const isSubmitting = ref(false)
const tags = ref<TagResp[]>([])
const selectedTags = ref<string[]>([])
const selectedTagToAdd = ref<string>('')

// 表单数据
const form = ref<AddBookmarkReq>({
  name: '',
  url: '',
  description: '',
  namespaceId: '',
  tagsIds: []
})

// 监听 open 属性变化
watch(() => props.open, (newValue) => {
  isOpen.value = newValue
  if (newValue) {
    // 每次打开时重新获取数据
    fetchTags()
    // 如果有默认空间ID，设置它
    if (props.defaultSpaceId) {
      form.value.namespaceId = props.defaultSpaceId
    }
    // 如果有默认标签IDs，设置它们
    if (props.defaultTagIds && props.defaultTagIds.length > 0) {
      selectedTags.value = [...props.defaultTagIds]
    }
  }
})

// 监听内部 open 状态变化
watch(isOpen, (newValue) => {
  emit('update:open', newValue)
  if (!newValue) {
    resetForm()
  }
})

// 计算属性 - 可用标签（排除已选择的）
const availableTags = computed(() => {
  return tags.value.filter(tag => !selectedTags.value.includes(tag.id))
})

// 获取标签名称
const getTagName = (tagId: string) => {
  const tag = tags.value.find(t => t.id === tagId)
  return tag ? tag.name : tagId
}

// 获取标签颜色
const getTagColor = (tagId: string) => {
  const tag = tags.value.find(t => t.id === tagId)
  return tag?.color || '#6b7280' // 默认灰色
}

// 处理标签选择
const handleTagSelect = (value: any) => {
  const tagId = value as string
  if (tagId && !selectedTags.value.includes(tagId)) {
    selectedTags.value.push(tagId)
  }
  selectedTagToAdd.value = ''
}

// 移除标签
const removeTag = (tagId: string) => {
  const index = selectedTags.value.indexOf(tagId)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  }
}

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    url: '',
    description: '',
    namespaceId: '',
    tagsIds: []
  }
  selectedTags.value = []
  selectedTagToAdd.value = ''
}

// 获取标签列表
const fetchTags = async () => {
  try {
    const response = await TagAPI.getAll() as any
    if (response?.code === 0 && response?.data) {
      tags.value = response.data.records || []
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

// 处理表单提交
const handleSubmit = async () => {
  if (!form.value.name.trim() || !form.value.url.trim()) {
    return
  }

  try {
    isSubmitting.value = true

    // 准备提交数据，过滤空值
    const submitData: AddBookmarkReq = {
      name: form.value.name.trim(),
      url: form.value.url.trim(),
      ...(form.value.description?.trim() && {description: form.value.description.trim()}),
      ...(form.value.namespaceId && {namespaceId: form.value.namespaceId}),
      ...(selectedTags.value.length > 0 && {tagsIds: selectedTags.value})
    }

    const response = await BookmarkAPI.create(submitData) as any

    if (response?.flag) {
      emit('success')
      isOpen.value = false
    } else {
      console.error('添加书签失败:', response?.message)
      alert(response?.message || '添加书签失败')
    }
  } catch (error) {
    console.error('Failed to create bookmark:', error)
    alert('添加书签失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

// 处理取消
const handleCancel = () => {
  isOpen.value = false
}

// 注释：不再在组件挂载时获取数据，改为在模态框打开时获取
</script>