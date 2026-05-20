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

  startAnalyze() {
    if (!this.data.imagePath || this.data.loading) return

    if (!app.requireLogin()) return

    this.setData({ loading: true })

    app.uploadFile({
      url: '/vision/recipe-combo',
      filePath: this.data.imagePath,
      showLoading: false
    }).then(res => {
      this.setData({ result: res })
    }).catch(() => {}).finally(() => {
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
