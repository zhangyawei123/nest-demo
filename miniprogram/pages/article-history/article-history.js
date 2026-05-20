const app = getApp()

Page({
  data: {
    articles: [],
    loading: false
  },

  onShow() {
    if (app.requireLogin()) {
      this.loadArticles()
    }
  },

  loadArticles() {
    this.setData({ loading: true })
    app.request({
      url: '/article-interaction/history',
      method: 'POST',
      showLoading: false
    }).then(res => {
      this.setData({ articles: (res || []).map(this.formatArticle) })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatArticle(article) {
    return {
      ...article,
      coverImage: article.logo || article.coverImage || '',
      viewedAtText: article.viewedAt ? String(article.viewedAt).slice(0, 10) : '',
      createdAtText: article.createdAt ? String(article.createdAt).slice(0, 10) : ''
    }
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/article-detail/article-detail?id=' + id })
  },

  onPullDownRefresh() {
    this.loadArticles()
    wx.stopPullDownRefresh()
  }
})
