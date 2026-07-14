import { md5 } from 'js-md5'
import request from './http'

export interface CaptchaResponse {
  captchaId: string
  svg: string
}

export interface AuthUser {
  id: number
  username: string
  points: number
  makeupSignInChances?: number
}

export interface LoginResponse {
  access_token: string
  user: AuthUser
}

export const getCaptcha = () => {
  return request.get('/auth/captcha') as unknown as Promise<CaptchaResponse>
}

export const login = (data: {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}) => {
  return request.post('/auth/login', {
    username: data.username,
    password: md5(data.password),
    captchaId: data.captchaId,
    captchaCode: data.captchaCode,
  }) as unknown as Promise<LoginResponse>
}

export const register = (data: { username: string; password: string }) => {
  return request.post('/auth/register', {
    username: data.username,
    password: md5(data.password),
  }) as unknown as Promise<AuthUser>
}
