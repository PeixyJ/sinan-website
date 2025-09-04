import CryptoJS from 'crypto-js'
/**
 * 密码加密工具类
 * 使用SHA-256进行密码哈希加密
 */

/**
 * 将字符串转换为Uint8Array
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

/**
 * 将ArrayBuffer转换为十六进制字符串
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer)
  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16)
    const paddedHexCode = hexCode.padStart(2, '0')
    return paddedHexCode
  })
  return hexCodes.join('')
}

/**
 * 使用SHA-256对密码进行加密
 * @param password 原始密码
 * @returns Promise<string> 加密后的密码哈希
 */
export async function encryptPassword(password: string): Promise<string> {
  try {
    // 判断是否为安全上下文且 crypto.subtle 可用
    if (window.isSecureContext && window.crypto?.subtle) {
      // 将密码转换为Uint8Array
  const data = stringToArrayBuffer(password)
      // 使用Web Crypto API的SHA-256算法进行哈希
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      // 将哈希结果转换为十六进制字符串
      return arrayBufferToHex(hashBuffer)
    } else {
      // 非安全环境，使用 crypto-js
      return CryptoJS.SHA256(password).toString()
    }
  } catch (error) {
    console.error('密码加密失败:', error)
    throw new Error('密码加密失败')
  }
}

/**
 * 带盐值的密码加密
 * @param password 原始密码
 * @param salt 盐值，如果不提供则使用默认盐值
 * @returns Promise<string> 加密后的密码哈希
 */
export async function encryptPasswordWithSalt(password: string, salt: string = 'sinan_default_salt'): Promise<string> {
  try {
    // 将密码和盐值组合
    const saltedPassword = password + salt
    
    // 使用SHA-256进行加密
    return await encryptPassword(saltedPassword)
  } catch (error) {
    console.error('带盐密码加密失败:', error)
    throw new Error('带盐密码加密失败')
  }
}