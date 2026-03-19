import request from '@/utils/request'

export function getMenuList() {
  return request.get('/menu/list')
}

export function getMenuTree() {
  return request.get('/menu/tree')
}

export function createMenu(data: any) {
  return request.post('/menu/create', data)
}

export function updateMenu(id: number, data: any) {
  return request.post(`/menu/update/${id}`, data)
}

export function deleteMenu(id: number) {
  return request.post(`/menu/delete/${id}`)
}
