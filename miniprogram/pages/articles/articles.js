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
    app.request({ url, showLoading: false }).then(res => {
      this.setData({ articles: (res || []).map(this.formatArticle) })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatArticle(article) {
    const text = String(article.content || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
    return {
      ...article,
      coverImage: article.logo || article.coverImage || '',
      summary: article.summary || text.slice(0, 68),
      createdAtText: article.createdAt ? String(article.createdAt).slice(0, 10) : ''
    }
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
