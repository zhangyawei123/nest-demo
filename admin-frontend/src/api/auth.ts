import request from '@/utils/request'

/**
 * 认证相关 API
 */

// 获取验证码
export const getCaptcha = () => {
  return request.get('/auth/captcha')
}

// 用户注册
export const register = (data: { username: string; password: string }) => {
  return request.post('/auth/register', data)
}

// 用户登录
export const login = (data: {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}) => {
  return request.post('/auth/login', data)
}

// 获取当前用户信息
export const getProfile = () => {
  return request.get('/auth/profile')
}
