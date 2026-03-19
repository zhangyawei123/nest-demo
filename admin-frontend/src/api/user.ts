import request from '@/utils/request'

/**
 * 用户管理相关 API
 */

// 查询用户信息
export function getUserDetail(id: number) {
  return request.get(`/user/detail/${id}`)
}

// 修改用户信息
export function updateUser(id: number, data: any) {
  return request.post(`/user/update/${id}`, data)
}

// 获取当前用户菜单
export function getMyMenus() {
  return request.get('/user/menus')
}

export function seedInit() {
  return request.post('/user/seed')
}
