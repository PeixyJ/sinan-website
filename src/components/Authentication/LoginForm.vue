<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ref } from "vue"
import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserAPI, GithubAPI, PasskeyAPI } from '@/services/api'
import type { Credential } from '@/types/api'
import { encryptPasswordWithSalt } from '@/lib/crypto'

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()

const emit = defineEmits<{
  'switch-to-register': []
}>()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')


const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date()
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000))
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

const handleGithubLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    const response = await GithubAPI.getRedirect()
    
    if (response.flag && response.data) {
      // 重定向到GitHub OAuth页面
      window.location.href = response.data as string
    } else {
      errorMessage.value = response.message || '获取GitHub登录链接失败'
    }
  } catch (error: any) {
    console.error('GitHub登录失败:', error)
    errorMessage.value = error.response?.data?.message || 'GitHub登录失败，请重试'
  } finally {
    loading.value = false
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

// 预处理获取选项
const preformatGetOptions = (options: any) => {
  // 确保 options 是有效的对象
  if (!options) {
    console.error('Assertion options is undefined or null');
    return null;
  }

  // 创建一个新对象，避免修改原始对象
  const formattedOptions = { ...options };
  
  // 将 base64 字符串转换为 ArrayBuffer
  if (formattedOptions.challenge) {
    formattedOptions.challenge = base64UrlToArrayBuffer(formattedOptions.challenge);
  }
  
  // 安全地处理 allowCredentials
  if (formattedOptions.allowCredentials && Array.isArray(formattedOptions.allowCredentials)) {
    formattedOptions.allowCredentials = formattedOptions.allowCredentials.map((credential: Credential) => {
      if (credential?.id) {
        return {
          ...credential,
          id: base64UrlToArrayBuffer(credential.id)
        };
      }
      return credential;
    });
  } else {
    // 如果 allowCredentials 不存在或不是数组，设置为空数组
    formattedOptions.allowCredentials = [];
  }
  
  return formattedOptions;
};

const handlePasskeyLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  
  try {
    // 1. 获取断言选项
    const optionsResp = await PasskeyAPI.getAssertionOptions();
    let options;

    // 如果返回的是字符串，则解析它
    if (typeof optionsResp.data === 'string') {
      options = JSON.parse(optionsResp.data);
    }
    options = options.publicKey
    console.info('options:', options);
            
    // 2. 获取凭证
    const cred = await navigator.credentials.get({
      publicKey: preformatGetOptions(options)
    }) as PublicKeyCredential;
    console.info('cred:', cred);

    const assertionResponse = cred.response as AuthenticatorAssertionResponse;

    const credential = {
        id: cred.id,
        rawId: arrayBufferToBase64Url(cred.rawId),
        type: cred.type,
        authenticatorAttachment: cred.authenticatorAttachment,
        clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : [],
        response: {
            authenticatorData: arrayBufferToBase64Url(assertionResponse.authenticatorData),
            clientDataJSON: arrayBufferToBase64Url(cred.response.clientDataJSON),
            signature: arrayBufferToBase64Url(assertionResponse.signature),
            userHandle: arrayBufferToBase64Url(assertionResponse.userHandle),
        }
    };
    
    // 3. 验证断言
    const credentialJson = JSON.stringify(credential);
    console.info('credentialJson:', credentialJson);
    const response = await PasskeyAPI.verifyAssertion(credentialJson);
    console.log('登录响应:', response)
    console.log('响应结构调试:', {
      flag: response.flag,
      data: response.data,
      SaTokenInfo: response.data?.tokenInfo,
      tokenValue: response.data?.tokenInfo?.tokenValue
    })

    // response 现在是 ApiResponse<UserLoginResp>
    if (response.flag) {
      if (response.data?.tokenInfo?.tokenValue) {
        successMessage.value = '登录成功！正在跳转到首页...'
        setCookie('satoken', response.data.tokenInfo.tokenValue, 7)
        console.log('Token已保存到cookie:', response.data.tokenInfo.tokenValue)
        
        // 保存用户信息到localStorage
        if (response.data.userInfo) {
          localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
          console.log('用户信息已保存到localStorage:', response.data.userInfo)
        }
        
        // 延迟跳转给用户反馈时间
        console.log('准备跳转到首页...')
        setTimeout(() => {
          console.log('执行跳转')
          try {
            window.location.href = '/'
          } catch (error) {
            console.error('跳转失败，尝试备用方法:', error)
            window.location.replace('/')
          }
        }, 1000)
      } else {
        console.error('登录成功但未获取到token:', response.data)
        errorMessage.value = '登录成功但未获取到认证信息，请重试'
      }
    } else {
      console.warn('登录失败:', response)
      errorMessage.value = response.message || '登录失败'
    }
    
  } catch (error: any) {
  console.error('Passkey登录失败:', error)
  errorMessage.value = error.response?.data?.message || 'Passkey登录失败，请重试'
  } finally {
    loading.value = false
  }
}

const handleLogin = async () => {
  if (!email.value || !password.value) {
    // 表单验证已经由 HTML5 required 属性处理
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    console.log('开始登录...')
    
    // 加密密码
    const encryptedPassword = await encryptPasswordWithSalt(password.value)
    console.log('密码已加密')
    
    const response = await UserAPI.doLogin({
      credential: email.value,
      password: encryptedPassword
    })

    console.log('登录响应:', response)
    console.log('响应结构调试:', {
      flag: response.flag,
      data: response.data,
      SaTokenInfo: response.data?.tokenInfo,
      tokenValue: response.data?.tokenInfo?.tokenValue
    })

    // response 现在是 ApiResponse<UserLoginResp>
    if (response.flag) {
      if (response.data?.tokenInfo?.tokenValue) {
        successMessage.value = '登录成功！正在跳转到首页...'
        setCookie('satoken', response.data.tokenInfo.tokenValue, 7)
        console.log('Token已保存到cookie:', response.data.tokenInfo.tokenValue)
        
        // 保存用户信息到localStorage
        if (response.data.userInfo) {
          localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
          console.log('用户信息已保存到localStorage:', response.data.userInfo)
        }
        
        // 延迟跳转给用户反馈时间
        console.log('准备跳转到首页...')
        setTimeout(() => {
          console.log('执行跳转')
          try {
            window.location.href = '/'
          } catch (error) {
            console.error('跳转失败，尝试备用方法:', error)
            window.location.replace('/')
          }
        }, 1000)
      } else {
        console.error('登录成功但未获取到token:', response.data)
        errorMessage.value = '登录成功但未获取到认证信息，请重试'
      }
    } else {
      console.warn('登录失败:', response)
      errorMessage.value = response.message || '登录失败'
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    errorMessage.value = error.response?.data?.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <form :class="cn('flex flex-col gap-6', props.class)" @submit.prevent="handleLogin">
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold">
        登录您的账户
      </h1>
      <p class="text-muted-foreground text-sm text-balance">
        请输入您的邮箱和密码来登录您的账户
      </p>
    </div>
    <div class="grid gap-6">
      <!-- 错误消息显示 -->
      <div v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-200">
        {{ errorMessage }}
      </div>
      
      <!-- 成功消息显示 -->
      <div v-if="successMessage" class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/50 dark:text-green-200">
        {{ successMessage }}
      </div>
      
      <div class="grid gap-3">
        <Label for="email">邮箱/用户名</Label>
        <Input id="email" type="text" placeholder="请输入您的邮箱或用户名" required v-model="email" />
      </div>
      <div class="grid gap-3">
        <div class="flex items-center">
          <Label for="password">密码</Label>
          <a
            href="#"
            class="ml-auto text-sm underline-offset-4 hover:underline"
          >
            忘记密码？
          </a>
        </div>
        <Input id="password" type="password" required v-model="password" />
      </div>
      <Button type="submit" class-name="w-full" :disabled="loading">
        {{ loading ? '登录中...' : '登录' }}
      </Button>
      <div class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span class="bg-background text-muted-foreground relative z-10 px-2">
          或者继续使用
        </span>
      </div>

      <div class="flex space-x-4">
        <Button variant="outline" class-name="w-full" @click="handleGithubLogin" :disabled="loading">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
              fill="currentColor"
            />
          </svg>
          使用 GitHub 登录
        </Button>

        <Button variant="outline" class-name="flex-1" @click="handlePasskeyLogin" :disabled="loading">
          <svg t="1756450338627" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1495" width="200" height="200"><path d="M469.333333 512c-46.933333 0-87.125333-16.725333-120.533333-50.133333C315.392 428.458667 298.666667 388.266667 298.666667 341.333333s16.725333-87.125333 50.133333-120.533333C382.208 187.392 422.4 170.666667 469.333333 170.666667s87.125333 16.725333 120.533334 50.133333C623.274667 254.208 640 294.4 640 341.333333s-16.725333 87.125333-50.133333 120.533334C556.458667 495.274667 516.266667 512 469.333333 512z m309.333334 384L725.333333 832v-156.8a134.741333 134.741333 0 0 1-61.866666-47.445333A121.898667 121.898667 0 0 1 640 554.666667c0-35.541333 12.458667-65.792 37.333333-90.666667A123.434667 123.434667 0 0 1 768 426.666667c35.541333 0 65.792 12.458667 90.666667 37.333333S896 519.125333 896 554.666667c0 27.008-7.808 51.370667-23.466667 73.088-15.658667 21.674667-36.266667 37.504-61.866666 47.445333V682.666667l42.666666 42.666666-42.666666 42.666667 42.666666 42.666667-74.666666 85.333333zM768 618.666667c17.792 0 32.853333-6.229333 45.354667-18.688 12.416-12.416 18.645333-27.52 18.645333-45.312 0-17.792-6.229333-32.853333-18.688-45.354667A61.696 61.696 0 0 0 768 490.666667c-17.792 0-32.853333 6.229333-45.354667 18.688A61.696 61.696 0 0 0 704 554.666667c0 17.792 6.229333 32.853333 18.688 45.354666 12.416 12.416 27.52 18.645333 45.312 18.645334z m-212.266667-57.6a233.813333 233.813333 0 0 0 22.912 92.245333c13.866667 28.842667 34.346667 52.48 61.354667 70.954667V853.333333H128v-118.4c0-24.192 6.058667-46.592 18.133333-67.2 12.074667-20.608 28.8-36.266667 50.133334-46.933333 42.666667-21.333333 86.954667-37.674667 132.821333-49.066667a580.352 580.352 0 0 1 183.466667-15.488c14.549333 1.066667 28.970667 2.688 43.178666 4.821334z" p-id="1496"></path></svg>
          使用 Passkey 登录
        </Button>
      </div>

    </div>
    <div class="text-center text-sm">
      还没有账户？
      <a href="#" class="underline underline-offset-4" @click.prevent="emit('switch-to-register')">
        立即注册
      </a>
    </div>
  </form>
</template>
