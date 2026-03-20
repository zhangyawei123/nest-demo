import request from '@/utils/request'

/**
 * 发布文章
 */
export function createArticle(data: {
  title: string
  logo?: string
  content: string
}) {
  return request({
    url: '/article/create',
    method: 'post',
    data
  })
}

/**
 * 获取所有文章列表
 */
export function getArticleList(params?: { keyword?: string }) {
  return request({
    url: '/article/list',
    method: 'get',
    params
  })
}

/**
 * 获取我的文章列表
 */
export function getMyArticles(params?: { keyword?: string }) {
  return request({
    url: '/article/my-list',
    method: 'get',
    params
  })
}

/**
 * 获取文章详情
 */
export function getArticleDetail(id: number) {
  return request({
    url: `/article/detail/${id}`,
    method: 'get'
  })
}

/**
 * 更新文章
 */
export function updateArticle(id: number, data: {
  title?: string
  logo?: string
  content?: string
}) {
  return request({
    url: `/article/update/${id}`,
    method: 'post',
    data
  })
}

/**
 * 删除文章
 */
export function deleteArticle(id: number) {
  return request({
    url: `/article/delete/${id}`,
    method: 'post'
  })
}
