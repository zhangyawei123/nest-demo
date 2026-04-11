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
      this.setData({ hotList: this.formatList(res || []) })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  refreshList() {
    this.setData({ loading: true })
    app.request({ url: '/douyin-hot/refresh', method: 'POST' }).then(res => {
      this.setData({ hotList: this.formatList(res || []) })
      wx.showToast({ title: '已刷新', icon: 'success' })
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false })
    })
  },

  formatList(list) {
    return list.map(item => ({
      ...item,
      hotValueText: item.hotValue > 10000 ? (item.hotValue / 10000).toFixed(1) + '万' : String(item.hotValue || '')
    }))
  },

  onPullDownRefresh() {
    this.loadHotList()
    wx.stopPullDownRefresh()
  }
})
