const app = getApp()

Page({
  data: {
    article: null,
    loading: false
  },

  onLoad(options) {
    if (options.id) {
      this.loadArticle(options.id)
    }
  },

  loadArticle(id) {
    this.setData({ loading: true })
    app.request({ url: '/article/detail/' + id }).then(res => {
      this.setData({ article: res })
      wx.setNavigationBarTitle({ title: res.title || '文章详情' })
    }).catch(() => {
      wx.showToast({ title: '加载失败', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  }
})
