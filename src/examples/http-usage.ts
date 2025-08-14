import { AuthAPI, UserAPI, FileAPI } from '@/services/api'
import { http } from '@/lib/http'

export async function loginExample() {
  try {
    const response = await AuthAPI.login({
      username: 'admin',
      password: 'password123'
    })
    
    if (response.data) {
      http.setToken(response.data.token, true)
      console.log('登录成功:', response.data.user)
    }
  } catch (error) {
    console.error('登录失败:', error)
  }
}

export async function getUsersExample() {
  try {
    const response = await UserAPI.getUsers({
      page: 1,
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    
    console.log('用户列表:', response.data)
  } catch (error) {
    console.error('获取用户列表失败:', error)
  }
}

export async function uploadFileExample(file: File) {
  try {
    const response = await FileAPI.uploadFile(file, (progress) => {
      console.log(`上传进度: ${progress}%`)
    })
    
    console.log('文件上传成功:', response.data)
  } catch (error) {
    console.error('文件上传失败:', error)
  }
}

export async function customRequestExample() {
  try {
    const response = await http.get('/custom-endpoint', {
      params: { id: 123 },
      skipInterceptor: false,
      showErrorMessage: true
    })
    
    console.log('自定义请求结果:', response.data)
  } catch (error) {
    console.error('自定义请求失败:', error)
  }
}