import request from '@/utils/request'

export function getRoleList() {
  return request.get('/role/list')
}

export function getRoleDetail(id: number) {
  return request.get(`/role/detail/${id}`)
}

export function createRole(data: { name: string; description?: string; menuIds?: number[] }) {
  return request.post('/role/create', data)
}

export function updateRole(id: number, data: { name?: string; description?: string; menuIds?: number[] }) {
  return request.post(`/role/update/${id}`, data)
}

export function deleteRole(id: number) {
  return request.post(`/role/delete/${id}`)
}

export function assignMenus(id: number, menuIds: number[]) {
  return request.post(`/role/assign-menus/${id}`, { menuIds })
}
