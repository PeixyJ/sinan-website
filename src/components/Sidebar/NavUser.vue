<script setup lang="ts">
import {ref, onMounted, computed} from "vue"
import {useRouter} from "vue-router"
import draggable from 'vuedraggable'
import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
  Upload,
  Download,
  ListOrdered,
  GripVertical,
  Trash2,
  KeyRound,
  Key,
  Copy,
  Plus,
  User,
  Edit,
  Settings,
} from "lucide-vue-next"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Button} from '@/components/ui/button'
import {Separator} from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {UserAPI, BookmarkAPI, SpaceAPI, TagAPI, PasskeyAPI} from '@/services/api'
import type {UserInfo, SpaceResp, TagResp, ChangePasswordReq, UserKeyResp, CreateUserKeyReq, PasskeyResp} from '@/types/api'
import Icon from "@/components/Base/Icon.vue"
import {eventBus, EVENTS} from '@/utils/eventBus'
import {encryptPasswordWithSalt} from '@/lib/crypto'

interface SpaceItem {
  id: string
  title: string
  icon?: string
  description?: string
  sort?: number
}

interface TagItem {
  id: string
  name: string
  color?: string
  description?: string
}

const user = ref<UserInfo | null>(null)
const loading = ref(true)
const router = useRouter()
const {isMobile} = useSidebar()

// 导入Chrome书签相关
const fileInput = ref<HTMLInputElement>()
const showImportResult = ref(false)
const importResultMessage = ref('')

// JSON导入相关
const jsonFileInput = ref<HTMLInputElement>()
const isImportingJson = ref(false)

// 导出相关
const isExporting = ref(false)

// 删除用户数据相关
const showClearDataDialog = ref(false)
const confirmationText = ref('')
const isClearing = ref(false)
const REQUIRED_TEXT = '我已备份数据,确认清空数据'

// 排序空间相关
const showSortSpaceDialog = ref(false)
const sortingSpaces = ref<SpaceItem[]>([])
const isLoadingSpaces = ref(false)
const isSavingSort = ref(false)

// 排序标签相关
const showSortTagDialog = ref(false)
const sortingTags = ref<TagItem[]>([])
const isLoadingTags = ref(false)
const isSavingTagSort = ref(false)

// 修改密码相关
const showChangePasswordDialog = ref(false)
const changePasswordForm = ref<ChangePasswordReq>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const isChangingPassword = ref(false)
const passwordErrors = ref<string[]>([])
const needOldPassword = ref(true) // 是否需要输入旧密码
const isLoadingPasswordState = ref(false)

// Key管理相关
const showKeyManagementDialog = ref(false)
const userKeys = ref<UserKeyResp[]>([])
const isLoadingKeys = ref(false)
const isCreatingKey = ref(false)
const isDeletingKey = ref(false)
const deletingKeyId = ref<string>('')
const newKeyForm = ref<CreateUserKeyReq>({
  keyName: '',
  description: ''
})
const showCreateKeyForm = ref(false)
const keyErrors = ref<string[]>([])
const showNewKeyDialog = ref(false)
const newCreatedKey = ref<UserKeyResp | null>(null)

// 账户设置相关
const showAccountSettingsDialog = ref(false)
const isEditingName = ref(false)
const newUserName = ref('')
const userPasskeys = ref<PasskeyResp[]>([])
const isLoadingPasskeys = ref(false)
const isUpdatingPasskey = ref(false)
const isDeletingPasskey = ref(false)
const isRegisteringPasskey = ref(false)
const showRegisterPasskeyForm = ref(false)
const editingPasskeyId = ref<string>('')
const editingPasskeyDescription = ref('')
const accountSettingsErrors = ref<string[]>([])
const newPasskeyForm = ref({
  name: '',
  description: ''
})

// 系统设置相关
const showSystemSettingsDialog = ref(false)
const systemSettings = ref({
  faviconSource: 'google' // 'google' | 'sinan'
})


const fetchUserInfo = async () => {
  try {
    loading.value = true
    const response = await UserAPI.info()

    if (response.code === 0 && response.data) {
      user.value = response.data
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
  } finally {
    loading.value = false
  }
}

const handleLogout = () => {
  // 删除 cookie 中的 satoken
  document.cookie = 'satoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

  // 跳转到 /auth 页面
  router.push('/auth')
}

// 触发文件选择
const triggerFileSelect = () => {
  fileInput.value?.click()
}

// 处理文件选择
const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  try {
    const response = await BookmarkAPI.importChrome(file)

    if (response.flag && response.data) {
      const data = response.data
      const totalCount = data.totalCount;
      const successCount = data.successCount;

      if (totalCount === 0) {
        importResultMessage.value = '未找到可导入的书签'
      } else if (successCount === totalCount) {
        importResultMessage.value = `🎉 导入成功！共导入 ${successCount} 个书签`
      } else {
        importResultMessage.value = `🎉` + data.message
      }
      // 如果成功导入了书签，刷新书签列表
      if (totalCount > 0) {
        eventBus.emit(EVENTS.REFRESH_BOOKMARKS)
        eventBus.emit(EVENTS.REFRESH_SPACES)
      }
    } else {
      importResultMessage.value = `导入失败：${response.message || '未知错误'}`
    }
  } catch (error: any) {
    console.error('Import failed:', error)
    importResultMessage.value = error.response?.data?.message || '导入失败，请检查文件格式是否正确'
  } finally {
    showImportResult.value = true
    // 清除文件选择，允许重复选择同一文件
    if (target) target.value = ''
  }
}

// 打开排序空间对话框
const openSortSpaceDialog = async () => {
  showSortSpaceDialog.value = true
  isLoadingSpaces.value = true

  try {
    const response = await SpaceAPI.getAll({
      page: 1,
      size: 100 // 加载所有空间
    })

    if (response.code === 0 && response.data) {
      sortingSpaces.value = response.data.records
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map((space: SpaceResp) => ({
            id: space.id,
            title: space.name,
            icon: space.icon,
            description: space.description,
            sort: space.sort
          }))
    }
  } catch (error) {
    console.error('获取空间列表失败:', error)
  } finally {
    isLoadingSpaces.value = false
  }
}

// 保存排序
const saveSortOrder = async () => {
  isSavingSort.value = true

  try {
    // 使用第二种方法：传递重新排序后的完整ID列表
    const sortedSpaceIds = sortingSpaces.value.map(space => space.id)

    const response = await SpaceAPI.dragSortSpaces({
      sortedSpaceIds: sortedSpaceIds
    })

    if (response.code === 0) {
      showSortSpaceDialog.value = false
      // 触发刷新空间列表事件
      eventBus.emit(EVENTS.REFRESH_SPACES)
      // 可以在这里添加成功提示
    }
  } catch (error) {
    console.error('保存排序失败:', error)
  } finally {
    isSavingSort.value = false
  }
}

// 打开排序标签对话框
const openSortTagDialog = async () => {
  showSortTagDialog.value = true
  isLoadingTags.value = true

  try {
    const response = await TagAPI.getAll({
      page: 1,
      size: 100 // 加载所有标签
    })

    if (response.code === 0 && response.data) {
      sortingTags.value = response.data.records
          .sort((a, b) => (a.sort || 0) - (b.sort || 0))
          .map((tag: TagResp) => ({
            id: tag.id,
            name: tag.name,
            color: tag.color,
            description: tag.description
          }))
    }
  } catch (error) {
    console.error('获取标签列表失败:', error)
  } finally {
    isLoadingTags.value = false
  }
}

// 保存标签排序
const saveTagSortOrder = async () => {
  isSavingTagSort.value = true

  try {
    // 使用第二种方法：传递重新排序后的完整ID列表
    const sortedTagIds = sortingTags.value.map(tag => tag.id)

    const response = await TagAPI.dragSortTags({
      sortedTagIds: sortedTagIds
    })

    if (response.code === 0) {
      showSortTagDialog.value = false
      // 触发刷新标签列表事件
      eventBus.emit(EVENTS.REFRESH_TAGS)
      // 可以在这里添加成功提示
    }
  } catch (error) {
    console.error('保存标签排序失败:', error)
  } finally {
    isSavingTagSort.value = false
  }
}

// 触发JSON文件选择
const triggerJsonFileSelect = () => {
  jsonFileInput.value?.click()
}

// 处理JSON文件选择
const handleJsonFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  // 检查文件类型
  if (!file.type.includes('json') && !file.name.toLowerCase().endsWith('.json')) {
    importResultMessage.value = '请选择正确的 JSON 文件'
    showImportResult.value = true
    if (target) target.value = ''
    return
  }

  try {
    isImportingJson.value = true
    const response = await UserAPI.import(file)

    if (response.code === 0 && response.data) {
      const data = response.data

      // 统计导入的各类数据
      const importedTags = data.importedTagsCount || 0
      const importedSpaces = data.importedSpacesCount || 0
      const importedBookmarks = data.importedBookmarksCount || 0
      const skippedTags = data.skippedTagsCount || 0
      const skippedSpaces = data.skippedSpacesCount || 0
      const skippedBookmarks = data.skippedBookmarksCount || 0

      const totalImported = importedTags + importedSpaces + importedBookmarks
      const totalSkipped = skippedTags + skippedSpaces + skippedBookmarks
      const totalCount = totalImported + totalSkipped

      if (totalCount === 0) {
        importResultMessage.value = '未找到可导入的数据'
      } else if (totalSkipped === 0) {
        // 全部成功导入
        let details = []
        if (importedTags > 0) details.push(`${importedTags} 个标签`)
        if (importedSpaces > 0) details.push(`${importedSpaces} 个空间`)
        if (importedBookmarks > 0) details.push(`${importedBookmarks} 个书签`)

        importResultMessage.value = `🎉 导入成功！共导入：${details.join('、')}`
      } else if (totalImported > 0) {
        // 部分导入成功
        let importedDetails = []
        let skippedDetails = []

        if (importedTags > 0) importedDetails.push(`${importedTags} 个标签`)
        if (importedSpaces > 0) importedDetails.push(`${importedSpaces} 个空间`)
        if (importedBookmarks > 0) importedDetails.push(`${importedBookmarks} 个书签`)

        if (skippedTags > 0) skippedDetails.push(`${skippedTags} 个标签`)
        if (skippedSpaces > 0) skippedDetails.push(`${skippedSpaces} 个空间`)
        if (skippedBookmarks > 0) skippedDetails.push(`${skippedBookmarks} 个书签`)

        importResultMessage.value = `导入完成！\n成功导入：${importedDetails.join('、')}\n跳过重复：${skippedDetails.join('、')}`
      } else {
        // 全部跳过
        importResultMessage.value = `导入失败！所有 ${totalCount} 条数据都已存在或无法导入`
      }

      // 如果有详细信息，添加到消息中
      if (data.details) {
        importResultMessage.value += `\n\n${data.details}`
      }

      // 如果有错误信息，优先显示错误
      if (data.errorMessage) {
        importResultMessage.value = `导入出错：${data.errorMessage}`
      }

      // 根据导入的内容刷新相应的列表
      if (totalImported > 0) {
        if (importedTags > 0) {
          eventBus.emit(EVENTS.REFRESH_TAGS)
        }
        if (importedSpaces > 0) {
          eventBus.emit(EVENTS.REFRESH_SPACES)
        }
        if (importedBookmarks > 0) {
          eventBus.emit(EVENTS.REFRESH_BOOKMARKS)
        }
      }
    } else {
      importResultMessage.value = `导入失败：${response.message || '未知错误'}`
    }
  } catch (error) {
    console.error('JSON import failed:', error)
    importResultMessage.value = '导入失败，请检查文件格式是否正确'
  } finally {
    isImportingJson.value = false
    showImportResult.value = true
    // 清除文件选择，允许重复选择同一文件
    if (target) target.value = ''
  }
}

// 处理导出
const handleExport = async () => {
  try {
    isExporting.value = true
    console.log('开始导出数据...')
    await UserAPI.export()
    console.log('数据导出成功')
    // 成功后可以显示提示消息，但不是必需的，因为下载已经开始
  } catch (error) {
    console.error('导出失败:', error)
    // 可以在这里显示错误提示
    importResultMessage.value = '导出失败，请稍后重试'
    showImportResult.value = true
  } finally {
    isExporting.value = false
  }
}

// 处理清空用户数据
const handleClearUserData = () => {
  showClearDataDialog.value = true
}

// 取消清空数据
const cancelClearData = () => {
  showClearDataDialog.value = false
  confirmationText.value = ''
}

// 检查确认文本是否正确
const isConfirmationValid = computed(() => {
  return confirmationText.value === REQUIRED_TEXT
})

// 执行清空数据
const executeClearData = async () => {
  if (!isConfirmationValid.value) return

  try {
    isClearing.value = true
    const response = await UserAPI.clear()

    if (response.code === 0) {
      // 清空成功，删除 cookie 并跳转到登录页
      document.cookie = 'satoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      router.push('/auth')
    } else {
      importResultMessage.value = `清空失败：${response.message || '未知错误'}`
      showImportResult.value = true
    }
  } catch (error) {
    console.error('清空用户数据失败:', error)
    importResultMessage.value = '清空失败，请稍后重试'
    showImportResult.value = true
  } finally {
    isClearing.value = false
    showClearDataDialog.value = false
    confirmationText.value = ''
  }
}

// 打开修改密码对话框
const openChangePasswordDialog = async () => {
  showChangePasswordDialog.value = true
  resetChangePasswordForm()
  await checkPasswordState()
}

// 检查密码状态
const checkPasswordState = async () => {
  try {
    isLoadingPasswordState.value = true
    const response = await UserAPI.passwordState()

    // 假设 API 返回的格式是 { code: 0, data: boolean }
    if (response.code === 0) {
      needOldPassword.value = response.data === true
    } else {
      // 如果获取失败，默认需要输入旧密码
      needOldPassword.value = true
    }
  } catch (error) {
    console.error('获取密码状态失败:', error)
    // 出错时默认需要输入旧密码
    needOldPassword.value = true
  } finally {
    isLoadingPasswordState.value = false
  }
}

// 重置修改密码表单
const resetChangePasswordForm = () => {
  changePasswordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  passwordErrors.value = []
}

// 验证密码表单
const validatePasswordForm = (): boolean => {
  passwordErrors.value = []

  // 如果需要输入当前密码，则检查当前密码
  if (needOldPassword.value && !changePasswordForm.value.currentPassword) {
    passwordErrors.value.push('请输入当前密码')
  }

  if (!changePasswordForm.value.newPassword) {
    passwordErrors.value.push('请输入新密码')
  } else if (changePasswordForm.value.newPassword.length < 6) {
    passwordErrors.value.push('新密码长度至少为6位')
  } else if (changePasswordForm.value.newPassword.length > 20) {
    passwordErrors.value.push('新密码长度不能超过20位')
  }

  if (!changePasswordForm.value.confirmPassword) {
    passwordErrors.value.push('请确认新密码')
  } else if (changePasswordForm.value.newPassword !== changePasswordForm.value.confirmPassword) {
    passwordErrors.value.push('两次输入的新密码不一致')
  }

  // 只有在需要输入当前密码时，才检查新密码是否与当前密码相同
  if (needOldPassword.value &&
      changePasswordForm.value.currentPassword &&
      changePasswordForm.value.newPassword &&
      changePasswordForm.value.currentPassword === changePasswordForm.value.newPassword) {
    passwordErrors.value.push('新密码不能与当前密码相同')
  }

  return passwordErrors.value.length === 0
}

// 执行修改密码
const executeChangePassword = async () => {
  if (!validatePasswordForm()) return

  try {
    isChangingPassword.value = true

    // 加密密码
    const encryptedNewPassword = await encryptPasswordWithSalt(changePasswordForm.value.newPassword)
    const encryptedConfirmPassword = await encryptPasswordWithSalt(changePasswordForm.value.confirmPassword)
    let encryptedCurrentPassword = null

    // 如果需要旧密码，则加密旧密码
    if (needOldPassword.value && changePasswordForm.value.currentPassword) {
      encryptedCurrentPassword = await encryptPasswordWithSalt(changePasswordForm.value.currentPassword)
    }

    // 根据是否需要旧密码构造请求数据
    const requestData: ChangePasswordReq = {
      currentPassword: encryptedCurrentPassword || '',
      newPassword: encryptedNewPassword,
      confirmPassword: encryptedConfirmPassword
    }

    const response = await UserAPI.changePassword(requestData)

    if (response.code === 0) {
      // 修改成功
      showChangePasswordDialog.value = false
      importResultMessage.value = '密码修改成功！'
      showImportResult.value = true
      resetChangePasswordForm()
    } else {
      passwordErrors.value = [response.message || '修改密码失败']
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    passwordErrors.value = ['修改密码失败，请稍后重试']
  } finally {
    isChangingPassword.value = false
  }
}

// 取消修改密码
const cancelChangePassword = () => {
  showChangePasswordDialog.value = false
  resetChangePasswordForm()
}

// 打开Key管理对话框
const openKeyManagementDialog = async () => {
  showKeyManagementDialog.value = true
  showCreateKeyForm.value = false
  resetCreateKeyForm()
  await fetchUserKeys()
}

// 获取用户Keys
const fetchUserKeys = async () => {
  try {
    isLoadingKeys.value = true
    keyErrors.value = []
    const response = await UserAPI.getKeys()

    if (response.code === 0 && response.data) {
      userKeys.value = response.data
    } else {
      keyErrors.value = [response.message || '获取密钥列表失败']
    }
  } catch (error) {
    console.error('获取用户Keys失败:', error)
    keyErrors.value = ['获取密钥列表失败，请稍后重试']
  } finally {
    isLoadingKeys.value = false
  }
}

// 显示创建Key表单
const showCreateForm = () => {
  showCreateKeyForm.value = true
  resetCreateKeyForm()
}

// 重置创建Key表单
const resetCreateKeyForm = () => {
  newKeyForm.value = {
    keyName: '',
    description: ''
  }
  keyErrors.value = []
}

// 创建新Key
const createNewKey = async () => {
  if (!newKeyForm.value.keyName?.trim()) {
    keyErrors.value = ['请输入密钥名称']
    return
  }

  try {
    isCreatingKey.value = true
    keyErrors.value = []
    const response = await UserAPI.createKey(newKeyForm.value)

    if (response.code === 0 && response.data) {
      // 创建成功，显示新创建的密钥
      newCreatedKey.value = response.data
      showNewKeyDialog.value = true
      showCreateKeyForm.value = false
      resetCreateKeyForm()
      await fetchUserKeys()
    } else {
      keyErrors.value = [response.message || '创建密钥失败']
    }
  } catch (error) {
    console.error('创建Key失败:', error)
    keyErrors.value = ['创建密钥失败，请稍后重试']
  } finally {
    isCreatingKey.value = false
  }
}

// 删除Key
const deleteKey = async (keyId: string) => {
  try {
    isDeletingKey.value = true
    deletingKeyId.value = keyId
    keyErrors.value = []
    const response = await UserAPI.deleteKey(keyId)

    if (response.code === 0) {
      // 删除成功，刷新列表
      await fetchUserKeys()
    } else {
      keyErrors.value = [response.message || '删除密钥失败']
    }
  } catch (error) {
    console.error('删除Key失败:', error)
    keyErrors.value = ['删除密钥失败，请稍后重试']
  } finally {
    isDeletingKey.value = false
    deletingKeyId.value = ''
  }
}

// 复制AccessToken到剪贴板
const copyAccessToken = async (token: string) => {
  try {
    await navigator.clipboard.writeText(token)
  } catch (error) {
    console.error('复制失败:', error)
  }
}

// 关闭Key管理对话框
const closeKeyManagementDialog = () => {
  showKeyManagementDialog.value = false
  showCreateKeyForm.value = false
  resetCreateKeyForm()
}

// 打开账户设置对话框
const openAccountSettingsDialog = async () => {
  showAccountSettingsDialog.value = true
  isEditingName.value = false
  showRegisterPasskeyForm.value = false
  newUserName.value = user.value?.name || ''
  resetNewPasskeyForm()
  await fetchUserPasskeys()
}

// 重置新Passkey表单
const resetNewPasskeyForm = () => {
  newPasskeyForm.value = {
    name: '',
    description: ''
  }
}

// 获取用户Passkey凭证
const fetchUserPasskeys = async () => {
  try {
    isLoadingPasskeys.value = true
    accountSettingsErrors.value = []
    const response = await PasskeyAPI.getPasskeys()
    
    if (response.code === 0 && response.data) {
      userPasskeys.value = response.data
    } else {
      accountSettingsErrors.value = [response.message || '获取Passkey列表失败']
    }
  } catch (error) {
    console.error('获取用户Passkey失败:', error)
    accountSettingsErrors.value = ['获取Passkey列表失败，请稍后重试']
  } finally {
    isLoadingPasskeys.value = false
  }
}

// 开始编辑用户名
const startEditingName = () => {
  isEditingName.value = true
  newUserName.value = user.value?.name || ''
}

// 取消编辑用户名
const cancelEditingName = () => {
  isEditingName.value = false
  newUserName.value = user.value?.name || ''
}

// 保存用户名
const saveUserName = async () => {
  if (!newUserName.value.trim()) {
    accountSettingsErrors.value = ['用户名不能为空']
    return
  }
  
  try {
    // 这里需要调用更新用户名的API
    // 暂时先模拟成功
    if (user.value) {
      user.value.name = newUserName.value
    }
    isEditingName.value = false
    accountSettingsErrors.value = []
  } catch (error) {
    console.error('更新用户名失败:', error)
    accountSettingsErrors.value = ['更新用户名失败，请稍后重试']
  }
}

// 开始编辑Passkey描述
const startEditingPasskeyDescription = (passkey: PasskeyResp) => {
  editingPasskeyId.value = passkey.id
  editingPasskeyDescription.value = passkey.describe || ''
}

// 取消编辑Passkey描述
const cancelEditingPasskeyDescription = () => {
  editingPasskeyId.value = ''
  editingPasskeyDescription.value = ''
}

// 保存Passkey描述
const savePasskeyDescription = async (passkeyId: string) => {
  try {
    isUpdatingPasskey.value = true
    accountSettingsErrors.value = []
    const response = await PasskeyAPI.updatePasskeyDescription({id: passkeyId, describe: editingPasskeyDescription.value})
    
    if (response.code === 0) {
      // 更新本地数据
      const passkey = userPasskeys.value.find(p => p.id === passkeyId)
      if (passkey) {
        passkey.describe = editingPasskeyDescription.value
      }
      editingPasskeyId.value = ''
      editingPasskeyDescription.value = ''
    } else {
      accountSettingsErrors.value = [response.message || '更新描述失败']
    }
  } catch (error) {
    console.error('更新Passkey描述失败:', error)
    accountSettingsErrors.value = ['更新描述失败，请稍后重试']
  } finally {
    isUpdatingPasskey.value = false
  }
}

// 删除Passkey凭证
const deletePasskey = async (passkeyId: string) => {
  try {
    isDeletingPasskey.value = true
    accountSettingsErrors.value = []
    const response = await PasskeyAPI.deletePasskey(passkeyId)
    
    if (response.code === 0) {
      // 从本地列表中移除
      userPasskeys.value = userPasskeys.value.filter(p => p.id !== passkeyId)
    } else {
      accountSettingsErrors.value = [response.message || '删除Passkey失败']
    }
  } catch (error) {
    console.error('删除Passkey失败:', error)
    accountSettingsErrors.value = ['删除Passkey失败，请稍后重试']
  } finally {
    isDeletingPasskey.value = false
  }
}


// Base64URL 转 ArrayBuffer
const base64UrlToArrayBuffer = (base64Url: any) => {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const buffer = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; i++) {
    buffer[i] = rawData.charCodeAt(i);
  }
  
  return buffer.buffer;
};
// ArrayBuffer 转 Base64URL
const arrayBufferToBase64Url = (arrayBuffer: any) => {
  const bytes = new Uint8Array(arrayBuffer);
  let str = '';
  
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  
  const base64 = window.btoa(str);
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// 将 PublicKeyCredential 转换为 JSON
const publicKeyCredentialToJSON = (credential: unknown): unknown => {
  if (Array.isArray(credential)) {
    return credential.map(publicKeyCredentialToJSON);
  }
  
  if (credential instanceof ArrayBuffer) {
    return arrayBufferToBase64Url(credential);
  }
  
  if (credential && typeof credential === 'object') {
    const obj: Record<string, unknown> = {};
    for (const key in credential) {
      obj[key] = publicKeyCredentialToJSON(
        (credential as Record<string, unknown>)[key]
      );
    }
    return obj;
  }
  
  return credential;
};

// 显示注册Passkey表单
const showRegisterForm = () => {
  showRegisterPasskeyForm.value = true
  resetNewPasskeyForm()
}

// 注册新Passkey
const registerPasskey = async () => {
  try {
    isRegisteringPasskey.value = true
    accountSettingsErrors.value = []

    // 1. 获取注册选项
    const optionsResp = await PasskeyAPI.getRegistrationOptions();
    let options;

    // 如果返回的是字符串，则解析它
    if (typeof optionsResp.data === 'string') {
        options = JSON.parse(optionsResp.data);
    }
    options = options.publicKey
    console.info('publicKey:', options);

    // 转换必要的字段为 ArrayBuffer
    options.user.id = base64UrlToArrayBuffer(options.user.id);
    options.challenge = base64UrlToArrayBuffer(options.challenge);
    
    // 转换 excludeCredentials 中的 id 字段
    if (options.excludeCredentials && Array.isArray(options.excludeCredentials)) {
      options.excludeCredentials = options.excludeCredentials.map((cred: any) => ({
        ...cred,
        id: base64UrlToArrayBuffer(cred.id)
      }));
    }
    
    // 2. 创建凭证
    const cred = await navigator.credentials.create({
      publicKey: options
    }) as PublicKeyCredential;
    console.info('cred:', cred);

    const attestationResponse = cred.response as AuthenticatorAttestationResponse;

    const credential = {
        id: cred.id,
        rawId: arrayBufferToBase64Url(cred.rawId),
        type: cred.type,
        authenticatorAttachment: cred?.authenticatorAttachment,
        clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : [],
        response: {
            clientDataJSON: arrayBufferToBase64Url(attestationResponse.clientDataJSON),
            attestationObject: arrayBufferToBase64Url(attestationResponse.attestationObject),
            transports: attestationResponse.getTransports ? attestationResponse.getTransports() : []
        }
    };
    
    // 3. 验证注册
    const credentialJson = JSON.stringify(publicKeyCredentialToJSON(credential));
    console.info('credentialJson:', credentialJson);
    const requestData = {
      credential: credentialJson,
      describe: newPasskeyForm.value.description
    };
    const response = await PasskeyAPI.verifyRegistration(requestData);
    if (response.code === 0 && response.data) {
      // 注册成功，添加到列表
      console.log("注册成功: ",response.data);
      fetchUserPasskeys();
      showRegisterPasskeyForm.value = false
      resetNewPasskeyForm()
    } else {
      accountSettingsErrors.value = [response.message || '注册Passkey失败']
    }
  } catch (error) {
    console.error('注册Passkey失败:', error)
    accountSettingsErrors.value = ['注册Passkey失败，请稍后重试']
  } finally {
    isRegisteringPasskey.value = false
  }
}

// 关闭账户设置对话框
const closeAccountSettingsDialog = () => {
  showAccountSettingsDialog.value = false
  isEditingName.value = false
  showRegisterPasskeyForm.value = false
  editingPasskeyId.value = ''
  accountSettingsErrors.value = []
}

// 读取系统设置从Cookie
const loadSystemSettings = () => {
  const cookies = document.cookie.split('; ')
  const settingsCookie = cookies.find(cookie => cookie.startsWith('systemSettings='))
  
  if (settingsCookie) {
    try {
      const settings = JSON.parse(decodeURIComponent(settingsCookie.split('=')[1]))
      systemSettings.value = { ...systemSettings.value, ...settings }
    } catch (error) {
      console.error('Failed to parse system settings:', error)
    }
  }
}

// 保存系统设置到Cookie
const saveSystemSettings = () => {
  const settingsJson = encodeURIComponent(JSON.stringify(systemSettings.value))
  // 设置Cookie，有效期为365天
  const expires = new Date()
  expires.setTime(expires.getTime() + (365 * 24 * 60 * 60 * 1000))
  document.cookie = `systemSettings=${settingsJson}; expires=${expires.toUTCString()}; path=/`
  
  // 触发事件通知其他组件设置已更新
  eventBus.emit('SYSTEM_SETTINGS_UPDATED', systemSettings.value)
  
  closeSystemSettingsDialog()
}

// 打开系统设置对话框
const openSystemSettingsDialog = () => {
  loadSystemSettings() // 加载最新设置
  showSystemSettingsDialog.value = true
}

// 关闭系统设置对话框
const closeSystemSettingsDialog = () => {
  showSystemSettingsDialog.value = false
}

onMounted(() => {
  fetchUserInfo()
  loadSystemSettings() // 初始化时加载系统设置
})
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <div v-if="loading" class="px-2 py-1 text-sm text-muted-foreground">
        加载中...
      </div>
      <DropdownMenu v-else-if="user">
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
              size="lg"
              class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="user.avatar" :alt="user.name"/>
              <AvatarFallback class="rounded-lg">
                {{ user.name.slice(0, 2).toUpperCase() }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ user.name }}</span>
              <span class="truncate text-xs">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4"/>
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
            class="w-[--reka-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            :side="isMobile ? 'bottom' : 'right'"
            align="end"
            :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-2 py-2 text-left text-sm">
              <Avatar class="h-7 w-7 rounded-lg flex-shrink-0">
                <AvatarImage :src="user.avatar" :alt="user.name"/>
                <AvatarFallback class="rounded-lg">
                  {{ user.name.slice(0, 2).toUpperCase() }}
                </AvatarFallback>
              </Avatar>
              <span class="font-semibold">{{ user.name }}</span>
              <span class="text-xs text-muted-foreground">{{ user.email }}</span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator/>
          <DropdownMenuItem @click="openSortSpaceDialog">
            <ListOrdered/>
            排序空间
          </DropdownMenuItem>
          <DropdownMenuItem @click="openSortTagDialog">
            <ListOrdered/>
            排序标签
          </DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuItem @click="triggerFileSelect">
            <Upload/>
            导入Chrome书签
          </DropdownMenuItem>
          <DropdownMenuItem @click="triggerJsonFileSelect" :disabled="isImportingJson">
            <Upload/>
            {{ isImportingJson ? '导入中...' : '导入用户数据' }}
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleExport" :disabled="isExporting">
            <Download/>
            {{ isExporting ? '导出中...' : '导出用户数据' }}
          </DropdownMenuItem>
          <DropdownMenuSeparator/>
          <DropdownMenuGroup>
            <DropdownMenuItem @click="openChangePasswordDialog">
              <KeyRound/>
              修改密码
            </DropdownMenuItem>
            <DropdownMenuItem @click="openKeyManagementDialog">
              <Key/>
              插件密钥
            </DropdownMenuItem>
            <DropdownMenuItem @click="openAccountSettingsDialog">
              <BadgeCheck/>
              账户设置
            </DropdownMenuItem>
            <DropdownMenuItem @click="openSystemSettingsDialog">
              <Settings/>
              系统设置
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator/>
          <DropdownMenuItem
              @click="handleClearUserData"
              class="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 class="text-red-600"/>
            清空用户数据
          </DropdownMenuItem>
          <DropdownMenuItem @click="handleLogout">
            <LogOut/>
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div v-else class="px-2 py-1 text-sm text-muted-foreground">
        用户信息加载失败
      </div>
    </SidebarMenuItem>
  </SidebarMenu>

  <!-- 隐藏的文件输入框 -->
  <input
      ref="fileInput"
      type="file"
      accept=".html"
      style="display: none"
      @change="handleFileSelect"
  />

  <!-- JSON文件输入框 -->
  <input
      ref="jsonFileInput"
      type="file"
      accept=".json,application/json"
      style="display: none"
      @change="handleJsonFileSelect"
  />

  <!-- 导入结果对话框 -->
  <AlertDialog v-model:open="showImportResult">
    <AlertDialogContent class="cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle>导入结果</AlertDialogTitle>
        <AlertDialogDescription>
          {{ importResultMessage }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogAction @click="showImportResult = false">
          确定
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 排序空间对话框 -->
  <AlertDialog v-model:open="showSortSpaceDialog">
    <AlertDialogContent class="max-w-2xl cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle>排序空间</AlertDialogTitle>
        <AlertDialogDescription>
          拖动空间项目以重新排序
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="py-4">
        <div v-if="isLoadingSpaces" class="text-center py-8 text-muted-foreground">
          加载中...
        </div>

        <div v-else-if="sortingSpaces.length === 0" class="text-center py-8 text-muted-foreground">
          暂无空间
        </div>

        <draggable
            v-else
            v-model="sortingSpaces"
            item-key="id"
            handle=".drag-handle"
            animation="200"
            class="space-y-2 max-h-[400px] overflow-y-auto pr-1"
        >
          <template #item="{ element }">
            <div
                class="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div class="drag-handle cursor-move p-1.5 hover:bg-accent rounded-md transition-colors">
                <GripVertical class="h-4 w-4 text-muted-foreground"/>
              </div>
              <Icon v-if="element.icon" :name="element.icon" class="h-4 w-4 flex-shrink-0"/>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ element.title }}</div>
                <div v-if="element.description" class="text-xs text-muted-foreground truncate">
                  {{ element.description }}
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isSavingSort">取消</AlertDialogCancel>
        <AlertDialogAction
            @click="saveSortOrder"
            :disabled="isSavingSort || isLoadingSpaces"
        >
          {{ isSavingSort ? '保存中...' : '保存排序' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 排序标签对话框 -->
  <AlertDialog v-model:open="showSortTagDialog">
    <AlertDialogContent class="max-w-2xl cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle>排序标签</AlertDialogTitle>
        <AlertDialogDescription>
          拖动标签项目以重新排序
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="py-4">
        <div v-if="isLoadingTags" class="text-center py-8 text-muted-foreground">
          加载中...
        </div>

        <div v-else-if="sortingTags.length === 0" class="text-center py-8 text-muted-foreground">
          暂无标签
        </div>

        <draggable
            v-else
            v-model="sortingTags"
            item-key="id"
            handle=".drag-handle"
            animation="200"
            class="space-y-2 max-h-[400px] overflow-y-auto pr-1"
        >
          <template #item="{ element }">
            <div
                class="flex items-center gap-3 px-3 py-2 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
              <div class="drag-handle cursor-move p-1.5 hover:bg-accent rounded-md transition-colors">
                <GripVertical class="h-4 w-4 text-muted-foreground"/>
              </div>
              <div
                  class="w-3 h-3 rounded-full flex-shrink-0"
                  :style="{ backgroundColor: element.color || '#52525b' }"
              ></div>
              <div class="flex-1 min-w-0">
                <div class="font-medium truncate">{{ element.name }}</div>
                <div v-if="element.description" class="text-xs text-muted-foreground truncate">
                  {{ element.description }}
                </div>
              </div>
            </div>
          </template>
        </draggable>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="isSavingTagSort">取消</AlertDialogCancel>
        <AlertDialogAction
            @click="saveTagSortOrder"
            :disabled="isSavingTagSort || isLoadingTags"
        >
          {{ isSavingTagSort ? '保存中...' : '保存排序' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 清空用户数据确认对话框 -->
  <AlertDialog v-model:open="showClearDataDialog">
    <AlertDialogContent class="cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle class="text-red-600">清空用户数据</AlertDialogTitle>
        <AlertDialogDescription class="space-y-3">
          <p>此操作将永久删除您的所有数据，包括：</p>
          <ul class="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>所有书签和标签</li>
            <li>空间和分类</li>
            <li>使用记录和统计</li>
            <li>个人设置</li>
          </ul>
          <p class="text-red-600 font-medium">此操作不可撤销！</p>
          <p>请输入以下文本以确认操作：</p>
          <p class="font-mono bg-muted p-2 rounded text-sm">{{ REQUIRED_TEXT }}</p>
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="py-4">
        <input
            v-model="confirmationText"
            type="text"
            placeholder="请输入确认文本"
            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelClearData" :disabled="isClearing">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
            @click="executeClearData"
            :disabled="!isConfirmationValid || isClearing"
            class="bg-red-600 hover:bg-red-700"
        >
          {{ isClearing ? '清空中...' : '确认清空' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- 修改密码对话框 -->
  <AlertDialog v-model:open="showChangePasswordDialog">
    <AlertDialogContent class="cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle>修改密码</AlertDialogTitle>
        <AlertDialogDescription>
          请输入当前密码和新密码来修改您的账户密码
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="space-y-4 py-4">
        <!-- 加载状态 -->
        <div v-if="isLoadingPasswordState" class="text-center py-4 text-muted-foreground">
          正在检查密码状态...
        </div>

        <!-- 错误提示 -->
        <div v-if="passwordErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-3">
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in passwordErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <!-- 当前密码 - 只有在需要时才显示 -->
        <div v-if="needOldPassword" class="space-y-2">
          <Label for="current-password">当前密码</Label>
          <Input
              id="current-password"
              type="password"
              v-model="changePasswordForm.currentPassword"
              placeholder="请输入当前密码"
              :disabled="isChangingPassword"
              autocomplete="current-password"
          />
        </div>

        <!-- 新密码 -->
        <div class="space-y-2">
          <Label for="new-password">新密码</Label>
          <Input
              id="new-password"
              type="password"
              v-model="changePasswordForm.newPassword"
              placeholder="请输入新密码（6-20位）"
              :disabled="isChangingPassword"
              autocomplete="new-password"
          />
        </div>

        <!-- 确认新密码 -->
        <div class="space-y-2">
          <Label for="confirm-password">确认新密码</Label>
          <Input
              id="confirm-password"
              type="password"
              v-model="changePasswordForm.confirmPassword"
              placeholder="请再次输入新密码"
              :disabled="isChangingPassword"
              autocomplete="new-password"
          />
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel @click="cancelChangePassword" :disabled="isChangingPassword">
          取消
        </AlertDialogCancel>
        <AlertDialogAction
            @click="executeChangePassword"
            :disabled="isChangingPassword || isLoadingPasswordState || !changePasswordForm.newPassword || !changePasswordForm.confirmPassword || (needOldPassword && !changePasswordForm.currentPassword)"
        >
          {{ isChangingPassword ? '修改中...' : '确认修改' }}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

  <!-- Key管理对话框 -->
  <Dialog v-model:open="showKeyManagementDialog">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Key class="h-5 w-5"/>
          插件密钥管理
        </DialogTitle>
        <DialogDescription>
          管理您的插件访问密钥，用于API调用和插件开发
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-4">
        <!-- 错误提示 -->
        <div v-if="keyErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-3">
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in keyErrors" :key="error">{{ error }}</li>
          </ul>
        </div>

        <!-- 创建新密钥按钮 -->
        <div class="flex justify-between items-center">
          <h3 class="text-sm font-medium">密钥列表</h3>
          <Button
              @click="showCreateForm"
              size="sm"
              :disabled="isLoadingKeys || isCreatingKey"
              v-if="!showCreateKeyForm"
          >
            <Plus class="h-4 w-4 mr-1"/>
            创建密钥
          </Button>
        </div>

        <!-- 创建密钥表单 -->
        <div v-if="showCreateKeyForm" class="bg-muted/50 p-4 rounded-lg space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-medium">创建新密钥</h4>
            <Button variant="ghost" size="sm" @click="showCreateKeyForm = false">
              取消
            </Button>
          </div>

          <div class="space-y-3">
            <div class="space-y-2">
              <Label for="key-name">密钥名称 *</Label>
              <Input
                  id="key-name"
                  v-model="newKeyForm.keyName"
                  placeholder="请输入密钥名称"
                  :disabled="isCreatingKey"
              />
            </div>

            <div class="space-y-2">
              <Label for="key-description">密钥描述</Label>
              <Input
                  id="key-description"
                  v-model="newKeyForm.description"
                  placeholder="请输入密钥用途描述（可选）"
                  :disabled="isCreatingKey"
              />
            </div>

            <Button
                @click="createNewKey"
                :disabled="isCreatingKey || !newKeyForm.keyName?.trim()"
                class="w-full"
            >
              {{ isCreatingKey ? '创建中...' : '创建密钥' }}
            </Button>
          </div>
        </div>

        <!-- 密钥列表 -->
        <div class="space-y-3">
          <!-- 加载状态 -->
          <div v-if="isLoadingKeys" class="text-center py-8 text-muted-foreground">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            加载密钥列表...
          </div>

          <!-- 空状态 -->
          <div v-else-if="userKeys.length === 0" class="text-center py-8 text-muted-foreground">
            <Key class="h-12 w-12 mx-auto mb-2 opacity-50"/>
            <p>暂无密钥</p>
            <p class="text-xs">创建您的第一个插件密钥</p>
          </div>

          <!-- 密钥列表 -->
          <div v-else class="space-y-2 max-h-[400px] overflow-y-auto">
            <div
                v-for="key in userKeys"
                :key="key.id"
                class="border rounded-lg p-3 bg-card"
            >
              <!-- 单行显示：名称、描述、密钥值、创建时间和删除按钮 -->
              <div class="flex items-center gap-2 text-sm">
                <h4 class="font-medium min-w-[80px]">{{ key.keyName || '未命名密钥' }}</h4>
                <span v-if="key.description" class="text-muted-foreground flex-1 truncate">
                  {{ key.description }}
                </span>
                <div class="font-mono text-xs bg-muted px-2 py-1 rounded border max-w-[200px]">
                  <span class="text-muted-foreground truncate block">{{ key.accessKey }}</span>
                </div>
                <div class="text-xs text-muted-foreground text-nowrap">
                  {{ new Date(key.createTime).toLocaleDateString() }}
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    @click="deleteKey(key.id)"
                    :disabled="isDeletingKey && deletingKeyId === key.id"
                    class="flex-shrink-0"
                >
                  <Trash2 class="h-3 w-3"/>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="closeKeyManagementDialog">
          关闭
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 新密钥创建成功对话框 -->
  <AlertDialog v-model:open="showNewKeyDialog">
    <AlertDialogContent class="cursor-pointer">
      <AlertDialogHeader>
        <AlertDialogTitle class="flex items-center gap-2 text-green-600">
          <Key class="h-5 w-5"/>
          密钥创建成功！
        </AlertDialogTitle>
        <AlertDialogDescription>
          您的新密钥已创建成功。请立即复制并妥善保存，关闭此对话框后将无法再次查看完整密钥。
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div class="space-y-4 py-4" v-if="newCreatedKey">
        <!-- 密钥信息 -->
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
          <div class="space-y-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium">密钥名称:</span>
              <span class="text-sm">{{ newCreatedKey.keyName || '未命名密钥' }}</span>
            </div>
            <div v-if="newCreatedKey.description" class="flex items-center gap-2">
              <span class="text-sm font-medium">描述:</span>
              <span class="text-sm text-muted-foreground">{{ newCreatedKey.description }}</span>
            </div>
          </div>

          <!-- AccessToken显示区域 -->
          <div class="space-y-2">
            <Label class="text-sm font-medium text-green-700">Access Token:</Label>
            <div class="relative">
              <div
                  class="font-mono text-sm bg-white p-3 rounded border-2 border-green-300 min-h-[60px] break-all select-all">
                {{ newCreatedKey.accessKey }}
              </div>
              <Button
                  variant="outline"
                  size="sm"
                  @click="copyAccessToken(newCreatedKey.accessKey)"
                  class="absolute top-2 right-2"
              >
                <Copy class="h-4 w-4"/>
                复制
              </Button>
            </div>
          </div>

          <div class="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
            ⚠️ 重要提示：请立即复制并保存此密钥，关闭对话框后将无法再次查看完整内容
          </div>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogAction @click="showNewKeyDialog = false" class="bg-green-600 hover:bg-green-700">
          我已保存密钥
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>

<!-- 账户设置对话框 -->
  <Dialog v-model:open="showAccountSettingsDialog">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <User class="h-5 w-5"/>
          账户设置
        </DialogTitle>
        <DialogDescription>
          管理您的账户基本信息和Passkey凭证
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-6 py-4">
        <!-- 错误提示 -->
        <div v-if="accountSettingsErrors.length > 0" class="bg-red-50 border border-red-200 rounded-md p-3">
          <ul class="text-sm text-red-600 space-y-1">
            <li v-for="error in accountSettingsErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
        
        <!-- 基本信息设置 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">基本信息</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label class="text-sm">用户名</Label>
            <div class="md:col-span-2">
              <div v-if="!isEditingName" class="flex items-center gap-2">
                <span class="text-sm">{{ user?.name }}</span>
                <Button variant="ghost" size="sm" @click="startEditingName">
                  <Edit class="h-3 w-3"/>
                </Button>
              </div>
              <div v-else class="flex items-center gap-2">
                <Input
                  v-model="newUserName"
                  placeholder="请输入用户名"
                  class="flex-1"
                />
                <Button size="sm" @click="saveUserName">保存</Button>
                <Button variant="outline" size="sm" @click="cancelEditingName">取消</Button>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Label class="text-sm">邮箱</Label>
            <span class="md:col-span-2 text-sm text-muted-foreground">{{ user?.email }}</span>
          </div>
        </div>
        
        <Separator />
        
        <!-- Passkey管理 -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-medium">Passkey凭证管理</h3>
            <div class="flex items-center gap-2">
              <Button 
                size="sm" 
                :disabled="isLoadingPasskeys"
                @click="fetchUserPasskeys"
              >
                刷新
              </Button>
              <Button 
                size="sm" 
                @click="showRegisterForm"
                :disabled="isLoadingPasskeys || showRegisterPasskeyForm"
              >
                <Plus class="h-3 w-3 mr-1"/>
                添加
              </Button>
            </div>
          </div>
          
          <!-- 注册Passkey表单 -->
          <div v-if="showRegisterPasskeyForm" class="bg-muted/50 p-4 rounded-lg space-y-3">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium">注册新Passkey</h4>
              <Button variant="ghost" size="sm" @click="showRegisterPasskeyForm = false">
                取消
              </Button>
            </div>
            
            <div class="space-y-3">
              <div class="space-y-2">
                <Label for="passkey-description">Passkey描述</Label>
                <Input
                  id="passkey-description"
                  v-model="newPasskeyForm.description"
                  placeholder="请输入Passkey描述（可选）"
                  :disabled="isRegisteringPasskey"
                />
              </div>
              
              <Button 
                @click="registerPasskey"
                :disabled="isRegisteringPasskey"
                class="w-full"
              >
                {{ isRegisteringPasskey ? '注册中...' : '注册Passkey' }}
              </Button>
            </div>
          </div>
          
          <!-- 加载状态 -->
          <div v-if="isLoadingPasskeys" class="text-center py-8 text-muted-foreground">
            <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            加载Passkey列表...
          </div>
          
          <!-- 空状态 -->
          <div v-else-if="userPasskeys.length === 0" class="text-center py-8 text-muted-foreground">
            <Key class="h-12 w-12 mx-auto mb-2 opacity-50"/>
            <p>暂无Passkey凭证</p>
            <p class="text-xs">您尚未注册任何Passkey凭证</p>
          </div>
          
          <!-- Passkey列表 -->
          <div v-else class="space-y-2 max-h-[300px] overflow-y-auto">
            <div 
              v-for="passkey in userPasskeys" 
              :key="passkey.id"
              class="border rounded-lg p-3 bg-card"
            >
              <!-- 单行显示 Passkey 信息 -->
              <div v-if="editingPasskeyId !== passkey.id" class="flex items-center gap-2">
                <Key class="h-4 w-4 text-primary flex-shrink-0"/>
                <span v-if="passkey.describe" class="text-sm font-medium min-w-[100px]">
                  {{ passkey.describe }}
                </span>
                <span v-else class="text-sm text-muted-foreground italic min-w-[100px]">
                  暂无描述
                </span>
                <div class="text-xs text-muted-foreground flex-1">
                  ID: {{ passkey.id.slice(0, 12) }}...
                </div>
                <div class="text-xs text-muted-foreground">
                  最后使用: {{ new Date(passkey.lastUsed).toLocaleDateString() }}
                </div>
                <Button variant="ghost" size="sm" @click="startEditingPasskeyDescription(passkey)">
                  <Edit class="h-3 w-3"/>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  @click="deletePasskey(passkey.id)"
                  :disabled="isDeletingPasskey"
                >
                  <Trash2 class="h-3 w-3"/>
                </Button>
              </div>
              
              <!-- 编辑模式 -->
              <div v-else class="flex items-center gap-2">
                <Key class="h-4 w-4 text-primary flex-shrink-0"/>
                <Input
                  v-model="editingPasskeyDescription"
                  placeholder="请输入描述"
                  class="flex-1 max-w-[200px]"
                />
                <Button 
                  size="sm" 
                  @click="savePasskeyDescription(passkey.id)"
                  :disabled="isUpdatingPasskey"
                >
                  保存
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  @click="cancelEditingPasskeyDescription"
                  :disabled="isUpdatingPasskey"
                >
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="closeAccountSettingsDialog">
          关闭
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <!-- 系统设置对话框 -->
  <Dialog v-model:open="showSystemSettingsDialog">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Settings class="h-5 w-5"/>
          系统设置
        </DialogTitle>
        <DialogDescription>
          配置系统相关设置
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-6 py-4">
        <!-- Favicon图标设置 -->
        <div class="space-y-4">
          <h3 class="text-sm font-medium">图标设置</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <Label class="text-sm mt-2">Favicon 来源</Label>
            <div class="md:col-span-2">
              <Select v-model="systemSettings.faviconSource">
                <SelectTrigger class="w-full">
                  <SelectValue placeholder="选择图标来源" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="google">Google S2</SelectItem>
                  <SelectItem value="sinan">Sinan 服务</SelectItem>
                </SelectContent>
              </Select>
              <p class="text-xs text-muted-foreground mt-2">选择网站图标的获取来源</p>
            </div>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="closeSystemSettingsDialog">
          取消
        </Button>
        <Button @click="saveSystemSettings">
          保存设置
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
