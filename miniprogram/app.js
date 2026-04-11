App({
  globalData: {
    // 开发环境用本地地址，上线时改为 'http://120.48.191.112/api'
    baseUrl: 'http://localhost:3000',
    token: '',
    userInfo: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.getUserInfo()
    }
  },

  getUserInfo() {
    const that = this
    that.request({ url: '/auth/profile' }).then(res => {
      that.globalData.userInfo = res
    }).catch(() => {})
  },

  uploadFile(options) {
    const app = this
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: app.globalData.baseUrl + options.url,
        filePath: options.filePath,
        name: options.name || 'file',
        formData: options.formData || {},
        header: {
          'Authorization': app.globalData.token ? 'Bearer ' + app.globalData.token : ''
        },
        success(res) {
          if (res.statusCode === 401) {
            wx.removeStorageSync('token')
            app.globalData.token = ''
            app.globalData.userInfo = null
            wx.navigateTo({ url: '/pages/login/login' })
            reject(new Error('未登录'))
            return
          }

          let data = {}
          try {
            data = JSON.parse(res.data)
          } catch (err) {
            wx.showToast({ title: '响应解析失败', icon: 'none' })
            reject(err)
            return
          }

          if (data.code === 200) {
            resolve(data.data)
          } else {
            wx.showToast({ title: data.message || '上传失败', icon: 'none' })
            reject(data)
          }
        },
        fail(err) {
          wx.showToast({ title: '上传失败', icon: 'none' })
          reject(err)
        }
      })
    })
  },

  request(options) {
    const app = this
    return new Promise((resolve, reject) => {
      wx.request({
        url: app.globalData.baseUrl + options.url,
        method: options.method || 'GET',
        data: options.data || {},
        header: {
          'Content-Type': 'application/json',
          'Authorization': app.globalData.token ? 'Bearer ' + app.globalData.token : ''
        },
        success(res) {
          if (res.statusCode === 401) {
            wx.removeStorageSync('token')
            app.globalData.token = ''
            app.globalData.userInfo = null
            wx.navigateTo({ url: '/pages/login/login' })
            reject(new Error('未登录'))
            return
          }
          const data = res.data
          if (data.code === 200) {
            resolve(data.data)
          } else {
            wx.showToast({ title: data.message || '请求失败', icon: 'none' })
            reject(data)
          }
        },
        fail(err) {
          wx.showToast({ title: '网络错误', icon: 'none' })
          reject(err)
        }
      })
    })
  }
})
