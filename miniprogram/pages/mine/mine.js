const app = getApp()

Page({
  data: {
    userInfo: null
  },

  onShow() {
    this.setData({ userInfo: app.globalData.userInfo })
  },

  goLogin() {
    wx.navigateTo({ url: '/pages/login/login' })
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url
    wx.navigateTo({ url })
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定要清除缓存吗？',
      success(res) {
        if (res.confirm) {
          wx.clearStorageSync()
          wx.showToast({ title: '缓存已清除', icon: 'success' })
        }
      }
    })
  },

  handleLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token')
          app.globalData.token = ''
          app.globalData.userInfo = null
          this.setData({ userInfo: null })
          wx.showToast({ title: '已退出', icon: 'success' })
        }
      }
    })
  }
})
