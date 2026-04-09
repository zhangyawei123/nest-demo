const app = getApp()

Page({
  data: {
    greeting: '',
    userInfo: null,
    notices: [],
    articles: [],
    hotList: []
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
    // 加载文章
    app.request({ url: '/article/list' }).then(res => {
      const articles = (res || []).slice(0, 5)
      this.setData({ articles })
    }).catch(() => {})

    // 加载热榜
    app.request({ url: '/douyin-hot' }).then(res => {
      this.setData({ hotList: res || [] })
    }).catch(() => {})

    // 加载公告
    if (app.globalData.token) {
      app.request({ url: '/notice/active' }).then(res => {
        this.setData({ notices: res || [] })
      }).catch(() => {})
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
