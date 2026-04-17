import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

let isRedirectingToLogin = false

const shouldBypassAuthRedirect = (url?: string) => {
  if (!url) return false
  return ['/auth/login'].some(path => url.includes(path))
}

/**
 * Axios 实例配置
 * baseURL 会在开发环境通过 vite.config.ts 的 proxy 代理到后端
 */
const MAX_RETRY = 1
const RETRY_DELAY = 1000

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * 请求拦截器 - 自动添加 Token
 */
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 统一处理错误
 * 后端统一返回格式：{ code: 200, message: '成功', data: ... }
 */
request.interceptors.response.use(
  (response) => {
    const res = response.data
    // 如果后端返回的是统一格式，直接返回 data
    if (res.code === 200) {
      return res.data
    }
    // 否则返回原始数据（兼容旧接口）
    return res
  },
  async (error) => {
    if (error.response) {
      const { status, data } = error.response
      const requestUrl = error.config?.url as string | undefined
      
      switch (status) {
        case 401:
          if (shouldBypassAuthRedirect(requestUrl)) {
            ElMessage.error(data.message || '请求失败')
            break
          }
          if (!isRedirectingToLogin) {
            isRedirectingToLogin = true
            ElMessage.error('登录已过期，请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            router.push('/login').finally(() => {
              isRedirectingToLogin = false
            })
          }
          break
        case 403:
          ElMessage.error('无权访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 409:
          ElMessage.error(data.message || '数据冲突')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(data.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }

    // 超时或网络错误自动重试（仅 GET 请求）
    const config = error.config
    if (
      config &&
      config.method === 'get' &&
      !config.__retryCount &&
      (!error.response || error.code === 'ECONNABORTED')
    ) {
      config.__retryCount = (config.__retryCount || 0) + 1
      if (config.__retryCount <= MAX_RETRY) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY))
        return request(config)
      }
    }

    return Promise.reject(error)
  }
)

export default request
