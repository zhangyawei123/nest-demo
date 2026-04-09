const app = getApp()

Page({
  data: {
    hotList: [],
    loading: false
  },

  onLoad() {
    this.loadHotList()
  },

  onShow() {
    this.loadHotList()
  },

  loadHotList() {
    this.setData({ loading: true })
    app.request({ url: '/douyin-hot' }).then(res => {
      this.setData({ hotList: res || [] })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  refreshList() {
    this.setData({ loading: true })
    app.request({ url: '/douyin-hot/refresh', method: 'POST' }).then(res => {
      this.setData({ hotList: res || [] })
      wx.showToast({ title: '已刷新', icon: 'success' })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  onPullDownRefresh() {
    this.loadHotList()
    wx.stopPullDownRefresh()
  }
})
