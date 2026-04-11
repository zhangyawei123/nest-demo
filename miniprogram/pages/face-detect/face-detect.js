const app = getApp()

Page({
  data: {
    imagePath: '',
    loading: false,
    result: null
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFiles[0].tempFilePath,
          result: null
        })
      }
    })
  },

  startDetect() {
    if (!this.data.imagePath || this.data.loading) return

    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    this.setData({ loading: true })

    app.uploadFile({
      url: '/vision/face-detect',
      filePath: this.data.imagePath
    }).then(res => {
      this.setData({ result: res })
    }).catch(() => {
      wx.showToast({ title: '识别失败，请重试', icon: 'none' })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  reset() {
    this.setData({
      imagePath: '',
      result: null
    })
  }
})
