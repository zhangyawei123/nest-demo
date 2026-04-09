const app = getApp()

Page({
  data: {
    notices: [],
    loading: false
  },

  onLoad() {
    this.loadNotices()
  },

  loadNotices() {
    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }
    this.setData({ loading: true })
    app.request({ url: '/notice/active' }).then(res => {
      this.setData({ notices: res || [] })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  onPullDownRefresh() {
    this.loadNotices()
    wx.stopPullDownRefresh()
  }
})
