const app = getApp()

Page({
  data: {
    greeting: '',
    userInfo: null,
    notices: [],
    articles: [],
    hotList: [],
    hotPreview: [],
    loadingArticles: false,
    loadingHot: false,
    productHighlights: [
      { title: '智能助手', desc: 'AI 对话和图片识别', icon: '🤖' },
      { title: '热点内容', desc: '文章与抖音热榜', icon: '🔥' },
      { title: '效率工具', desc: '生活工具一站使用', icon: '🧰' }
    ]
  },

  onLoad() {
    this.setGreeting()
  },

  onShow() {
    this.setData({ userInfo: app.globalData.userInfo })
    this.loadData()
  },

  setGreeting() {
    const h = new Date().getHours()
    let greeting = '晚上好'
    if (h < 6) greeting = '凌晨好'
    else if (h < 12) greeting = '上午好'
    else if (h < 14) greeting = '中午好'
    else if (h < 18) greeting = '下午好'
    this.setData({ greeting })
  },

  loadData() {
    this.setData({ loadingArticles: true, loadingHot: true })
    app.request({ url: '/article/list', showLoading: false }).then(res => {
      const articles = (res || []).slice(0, 5).map(this.formatArticle)
      this.setData({ articles })
    }).catch(() => {}).finally(() => {
      this.setData({ loadingArticles: false })
    })

    app.request({ url: '/douyin-hot', showLoading: false }).then(res => {
      const hotList = res || []
      this.setData({
        hotList,
        hotPreview: hotList.slice(0, 5)
      })
    }).catch(() => {}).finally(() => {
      this.setData({ loadingHot: false })
    })

    if (app.globalData.token) {
      app.request({ url: '/notice/active', showLoading: false, silent: true }).then(res => {
        this.setData({ notices: res || [] })
      }).catch(() => {})
    } else {
      this.setData({ notices: [] })
    }
  },

  formatArticle(article) {
    return {
      ...article,
      createdAtText: article.createdAt ? String(article.createdAt).slice(0, 10) : ''
    }
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    // tabBar 页面用 switchTab
    if (['/pages/articles/articles', '/pages/hot/hot', '/pages/mine/mine'].includes(url)) {
      wx.switchTab({ url })
    } else {
      wx.navigateTo({ url })
    }
  },

  goArticle(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/article-detail/article-detail?id=' + id })
  },

  goNotice() {
    wx.navigateTo({ url: '/pages/notice/notice' })
  },

  goLogin() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
    }
  },

  onPullDownRefresh() {
    this.loadData()
    wx.stopPullDownRefresh()
  }
})
