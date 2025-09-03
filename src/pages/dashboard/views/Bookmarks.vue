<template>
  <div class="p-5 h-[calc(100vh-64px)] flex flex-col bg-background overflow-hidden">
    <div class="flex-1 grid grid-cols-[1fr_320px] gap-5 min-h-0" v-if="currentBookmark">
      <div class="bg-card border border-border/60 rounded-xl flex flex-col shadow-sm overflow-hidden">
        <div class="p-5 border-b border-border/40">
          <div class="flex items-center gap-3 mb-4" v-if="bookmarks.length > 0">
            <span class="text-sm text-muted-foreground font-medium">进度: {{ currentIndex + 1 }} / {{ totalCount }}</span>
            <div class="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-300 ease-in-out" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-5 items-end">
            <div class="min-w-0">
              <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">书签名称</label>
              <div class="relative">
                <input
                  v-if="isEditingName"
                  v-model="editedName"
                  @blur="saveBookmarkName"
                  @keyup.enter="saveBookmarkName"
                  @keyup.esc="cancelEditName"
                  class="w-full px-3 py-2.5 text-base font-medium text-foreground bg-background border border-primary rounded-lg outline-none h-11 box-border"
                  ref="nameInput"
                  type="text"
                />
                <div v-else class="flex items-center gap-2 px-3 py-2.5 bg-muted/50 border border-border/60 rounded-lg cursor-pointer transition-all hover:bg-muted/70 hover:border-border/80 h-11 box-border" @click="startEditName">
                  <span class="text-base font-medium text-foreground flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ currentBookmark.name }}</span>
                  <svg class="w-4 h-4 text-muted-foreground transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
              </div>
            </div>
            <div class="min-w-0">
              <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">URL</label>
              <a :href="currentBookmark.url" target="_blank" class="flex items-center gap-1.5 px-3 py-2.5 bg-muted/50 border border-border/60 rounded-lg text-primary no-underline text-sm transition-all hover:bg-primary/10 hover:border-primary/50 h-11 box-border whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ currentBookmark.url }}</span>
                <svg class="w-3.5 h-3.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </a>
            </div>
            <div class="min-w-0">
              <label class="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">描述</label>
              <div class="relative">
                <input
                  v-if="isEditingDescription"
                  v-model="editedDescription"
                  @blur="saveBookmarkDescription"
                  @keyup.enter="saveBookmarkDescription"
                  @keyup.esc="cancelEditDescription"
                  class="w-full px-3 py-2.5 text-sm text-foreground bg-background border border-primary rounded-lg outline-none h-11 box-border font-inherit"
                  ref="descriptionInput"
                  placeholder="添加书签描述..."
                  type="text"
                />
                <div v-else class="flex items-center gap-2 px-3 py-2.5 bg-muted/50 border border-border/60 rounded-lg cursor-pointer transition-all hover:bg-muted/70 hover:border-border/80 h-11 box-border" @click="startEditDescription">
                  <span class="text-sm text-muted-foreground flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ currentBookmark.description || '点击添加描述...' }}</span>
                  <svg class="w-4 h-4 text-muted-foreground transition-colors" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex-1 flex flex-col min-h-0">
          <div class="px-5 py-3 bg-muted/30 border-b border-border/40 flex justify-between items-center">
            <span class="text-sm font-semibold text-muted-foreground">网站预览</span>
            <div class="flex gap-2">
              <button @click="reloadIframe" class="p-1.5 bg-background/80 border border-border/60 rounded-md cursor-pointer transition-all text-muted-foreground hover:bg-muted/50 hover:border-border/80 hover:text-foreground" title="刷新预览">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
              <button @click="deleteBookmark" class="p-1.5 bg-background/80 border border-border/60 rounded-md cursor-pointer transition-all text-muted-foreground hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive" title="删除书签">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 relative bg-background">
            <iframe 
              v-if="currentBookmark?.url"
              :key="iframeKey"
              :src="currentBookmark.url"
              class="w-full h-full border-0 bg-background"
              frameborder="0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              @error="handleIframeError"
              @load="handleIframeLoad"
            />
            <div v-else class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-muted">
              <span class="text-muted-foreground text-sm">URL预览</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-card border border-border/60 rounded-xl p-5 shadow-sm flex flex-col max-h-full overflow-hidden">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-base font-semibold text-foreground m-0">选择空间</h3>
          <button @click="fetchSpaces" class="p-1.5 bg-background/80 border border-border/60 rounded-md cursor-pointer transition-all text-muted-foreground hover:bg-muted/50 hover:border-border/80 hover:text-foreground flex items-center justify-center" title="刷新空间列表">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
          </button>
        </div>
        <div class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2.5 overflow-y-auto pr-1 py-2">
          <button
            v-for="space in spaces"
            :key="space.id"
            class="flex flex-col items-center gap-2 px-3 py-4 bg-muted/40 border border-border/60 rounded-lg cursor-pointer transition-all hover:bg-primary/10 hover:border-primary hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/10"
            @click="assignToSpace(space.id)"
            :title="space.name"
          >
            <Icon v-if="space.icon" :name="space.icon" :size="20" />
            <span class="text-sm font-medium text-foreground text-center break-words leading-tight">{{ space.name }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center bg-card border border-border/60 rounded-xl text-muted-foreground text-base" v-else-if="!loading && bookmarks.length === 0">
      <p>没有找到游离的书签</p>
    </div>

    <div class="flex-1 flex items-center justify-center bg-card border border-border/60 rounded-xl text-muted-foreground text-base" v-else-if="loading">
      <p>加载中...</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import Icon from '@/components/Base/Icon.vue'
import { BookmarkAPI, SpaceAPI } from '@/services/api'
import type { BookmarkResp, SpaceRespSimple } from '@/types/api'

const bookmarks = ref<BookmarkResp[]>([])
const spaces = ref<SpaceRespSimple[]>([])
const currentBookmark = ref<BookmarkResp | null>(null)
const loading = ref(true)
const isEditingName = ref(false)
const editedName = ref('')
const nameInput = ref<HTMLInputElement | null>(null)
const isEditingDescription = ref(false)
const editedDescription = ref('')
const descriptionInput = ref<HTMLTextAreaElement | null>(null)
const currentIndex = ref(0)
const totalCount = ref(0)
const iframeKey = ref(0)

const progressPercentage = computed(() => {
  if (totalCount.value === 0) return 0
  return ((currentIndex.value + 1) / totalCount.value) * 100
})

const fetchBookmarksWithoutSpace = async () => {
  try {
    loading.value = true
    const response = await BookmarkAPI.noSpaceBookmark()
    bookmarks.value = response.data
    totalCount.value = bookmarks.value.length
    currentIndex.value = 0
    if (bookmarks.value.length > 0) {
      currentBookmark.value = bookmarks.value[0]
    }
  } catch (error) {
    console.error('Failed to fetch bookmarks without space:', error)
  } finally {
    loading.value = false
  }
}

const fetchSpaces = async () => {
  try {
    const response = await SpaceAPI.getAllList()
    console.log('Spaces response:', response)
    spaces.value = response.data.records || response.data
  } catch (error) {
    console.error('Failed to fetch spaces:', error)
  }
}

const startEditName = () => {
  if (!currentBookmark.value) return
  isEditingName.value = true
  editedName.value = currentBookmark.value.name
  nextTick(() => {
    nameInput.value?.focus()
    nameInput.value?.select()
  })
}

const saveBookmarkName = async () => {
  if (!currentBookmark.value || !editedName.value.trim()) {
    cancelEditName()
    return
  }
  
  try {
    await BookmarkAPI.update({
      id: currentBookmark.value.id,
      name: editedName.value.trim()
    })
    currentBookmark.value.name = editedName.value.trim()
    isEditingName.value = false
  } catch (error) {
    console.error('Failed to update bookmark name:', error)
    cancelEditName()
  }
}

const cancelEditName = () => {
  isEditingName.value = false
  editedName.value = ''
}

const startEditDescription = () => {
  if (!currentBookmark.value) return
  isEditingDescription.value = true
  editedDescription.value = currentBookmark.value.description || ''
  nextTick(() => {
    descriptionInput.value?.focus()
    descriptionInput.value?.select()
  })
}

const saveBookmarkDescription = async () => {
  if (!currentBookmark.value) {
    cancelEditDescription()
    return
  }
  
  try {
    await BookmarkAPI.update({
      id: currentBookmark.value.id,
      description: editedDescription.value.trim()
    })
    currentBookmark.value.description = editedDescription.value.trim()
    isEditingDescription.value = false
  } catch (error) {
    console.error('Failed to update bookmark description:', error)
    cancelEditDescription()
  }
}

const cancelEditDescription = () => {
  isEditingDescription.value = false
  editedDescription.value = ''
}

const assignToSpace = async (spaceId: string) => {
  if (!currentBookmark.value) return
  
  try {
    const updateData: any = {
      id: currentBookmark.value.id,
      namespaceId: spaceId
    }
    
    if (editedName.value.trim() && editedName.value !== currentBookmark.value.name) {
      updateData.name = editedName.value.trim()
    }
    
    if (editedDescription.value.trim() !== (currentBookmark.value.description || '')) {
      updateData.description = editedDescription.value.trim()
    }
    
    await BookmarkAPI.update(updateData)
    
    bookmarks.value = bookmarks.value.filter(b => b.id !== currentBookmark.value!.id)
    totalCount.value = bookmarks.value.length
    
    if (bookmarks.value.length > 0) {
      // 保持当前索引，如果超出范围则调整到最后一个
      if (currentIndex.value >= bookmarks.value.length) {
        currentIndex.value = bookmarks.value.length - 1
      }
      currentBookmark.value = bookmarks.value[currentIndex.value]
      editedName.value = ''
      isEditingName.value = false
      editedDescription.value = ''
      isEditingDescription.value = false
      iframeKey.value++
    } else {
      currentBookmark.value = null
      currentIndex.value = 0
    }
  } catch (error) {
    console.error('Failed to assign bookmark to space:', error)
  }
}

const reloadIframe = () => {
  iframeKey.value++
}

const handleIframeLoad = () => {
  // iframe loaded successfully
}

const deleteBookmark = async () => {
  if (!currentBookmark.value) return
  
  try {
    await BookmarkAPI.delete(currentBookmark.value.id)
    
    bookmarks.value = bookmarks.value.filter(b => b.id !== currentBookmark.value!.id)
    totalCount.value = bookmarks.value.length
    
    if (bookmarks.value.length > 0) {
      // 保持当前索引，如果超出范围则调整到最后一个
      if (currentIndex.value >= bookmarks.value.length) {
        currentIndex.value = bookmarks.value.length - 1
      }
      currentBookmark.value = bookmarks.value[currentIndex.value]
      editedName.value = ''
      isEditingName.value = false
      editedDescription.value = ''
      isEditingDescription.value = false
      iframeKey.value++
    } else {
      currentBookmark.value = null
      currentIndex.value = 0
    }
  } catch (error) {
    console.error('Failed to delete bookmark:', error)
  }
}

const handleIframeError = () => {
  console.warn('Failed to load URL preview for:', currentBookmark.value?.url)
}

onMounted(() => {
  fetchBookmarksWithoutSpace()
  fetchSpaces()
})
</script>