const app = getApp()

Page({
  data: {
    article: null,
    articleId: null,
    isFavorite: false,
    favoriteLoading: false,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ articleId: Number(options.id) })
      this.loadArticle(options.id)
    }
  },

  loadArticle(id) {
    this.setData({ loading: true })
    app.request({ url: '/article/detail/' + id, showLoading: false }).then(res => {
      this.setData({ article: this.formatArticle(res) })
      wx.setNavigationBarTitle({ title: res.title || '文章详情' })
      this.loadInteractionStatus(id)
      this.markViewed(id)
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatArticle(article) {
    return {
      ...article,
      coverImage: article.logo || article.coverImage || '',
      createdAtText: article.createdAt ? String(article.createdAt).slice(0, 10) : ''
    }
  },

  loadInteractionStatus(id) {
    if (!app.globalData.token) return
    app.request({
      url: '/article-interaction/status',
      method: 'POST',
      showLoading: false,
      silent: true,
      data: { articleId: Number(id) }
    }).then(res => {
      this.setData({ isFavorite: !!res.isFavorite })
    }).catch(() => {})
  },

  markViewed(id) {
    if (!app.globalData.token) return
    app.request({
      url: '/article-interaction/mark-viewed',
      method: 'POST',
      showLoading: false,
      silent: true,
      data: { articleId: Number(id) }
    }).catch(() => {})
  },

  toggleFavorite() {
    if (!app.requireLogin() || this.data.favoriteLoading || !this.data.articleId) return
    this.setData({ favoriteLoading: true })
    app.request({
      url: '/article-interaction/toggle-favorite',
      method: 'POST',
      showLoading: false,
      data: { articleId: this.data.articleId }
    }).then(res => {
      this.setData({ isFavorite: !!res.isFavorite })
      wx.showToast({
        title: res.isFavorite ? '已收藏' : '已取消',
        icon: 'success'
      })
    }).finally(() => {
      this.setData({ favoriteLoading: false })
    })
  }
})
