const app = getApp()

Page({
  data: {
    articles: [],
    keyword: '',
    loading: false
  },

  onLoad() {
    this.loadArticles()
  },

  onShow() {
    this.loadArticles()
  },

  loadArticles() {
    this.setData({ loading: true })
    const url = this.data.keyword ? '/article/list?keyword=' + this.data.keyword : '/article/list'
    app.request({ url }).then(res => {
      this.setData({ articles: res || [] })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  onSearch(e) {
    this.setData({ keyword: e.detail.value })
  },

  doSearch() {
    this.loadArticles()
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
