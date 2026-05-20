App({
  globalData: {
    // 开发环境用本地地址，上线时改为 'http://120.48.191.112/api'
    baseUrl: 'http://localhost:3000',
    token: '',
    userInfo: null,
    loadingCount: 0,
    redirectingToLogin: false
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
    that.request({ url: '/auth/profile', showLoading: false, silent: true }).then(res => {
      that.globalData.userInfo = res
    }).catch(() => {})
  },

  showGlobalLoading(title) {
    this.globalData.loadingCount += 1
    if (this.globalData.loadingCount === 1) {
      wx.showLoading({
        title: title || '加载中',
        mask: true
      })
    }
  },

  hideGlobalLoading() {
    if (this.globalData.loadingCount > 0) {
      this.globalData.loadingCount -= 1
    }
    if (this.globalData.loadingCount === 0) {
      wx.hideLoading()
    }
  },

  showError(message, options) {
    if (options && options.silent) return
    wx.showToast({
      title: message || '操作失败',
      icon: 'none'
    })
  },

  clearLoginState() {
    wx.removeStorageSync('token')
    this.globalData.token = ''
    this.globalData.userInfo = null
  },

  setLoginState(token) {
    wx.setStorageSync('token', token)
    this.globalData.token = token
  },

  requireLogin() {
    if (this.globalData.token) return true
    this.showError('请先登录')
    wx.navigateTo({ url: '/pages/login/login' })
    return false
  },

  handleUnauthorized(options) {
    this.clearLoginState()
    if (!options || !options.silent) {
      this.showError('登录已过期，请重新登录')
    }
    if (this.globalData.redirectingToLogin) return
    const pages = getCurrentPages()
    const currentRoute = pages.length ? pages[pages.length - 1].route : ''
    if (currentRoute === 'pages/login/login') return
    this.globalData.redirectingToLogin = true
    wx.navigateTo({
      url: '/pages/login/login',
      complete: () => {
        setTimeout(() => {
          this.globalData.redirectingToLogin = false
        }, 500)
      }
    })
  },

  normalizeResponse(data, fallbackMessage) {
    if (!data || typeof data !== 'object') {
      return {
        ok: false,
        message: fallbackMessage || '响应异常'
      }
    }
    if (data.code === 200) {
      return {
        ok: true,
        data: data.data
      }
    }
    return {
      ok: false,
      message: data.message || fallbackMessage || '请求失败',
      data
    }
  },

  uploadFile(options) {
    const app = this
    return new Promise((resolve, reject) => {
      if (options.showLoading === true) {
        app.showGlobalLoading(options.loadingTitle || '上传中')
      }
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
            app.handleUnauthorized(options)
            reject(new Error('未登录'))
            return
          }

          let data = {}
          try {
            data = JSON.parse(res.data)
          } catch (err) {
            app.showError('响应解析失败', options)
            reject(err)
            return
          }

          const result = app.normalizeResponse(data, '上传失败')
          if (result.ok) {
            resolve(result.data)
          } else {
            app.showError(result.message, options)
            reject(result.data)
          }
        },
        fail(err) {
          app.showError('上传失败，请检查网络后重试', options)
          reject(err)
        },
        complete() {
          if (options.showLoading === true) {
            app.hideGlobalLoading()
          }
        }
      })
    })
  },

  request(options) {
    const app = this
    return new Promise((resolve, reject) => {
      if (options.showLoading === true) {
        app.showGlobalLoading(options.loadingTitle || '加载中')
      }
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
            app.handleUnauthorized(options)
            reject(new Error('未登录'))
            return
          }
          if (res.statusCode < 200 || res.statusCode >= 300) {
            app.showError('服务异常，请稍后重试', options)
            reject(res)
            return
          }
          const data = res.data
          const result = app.normalizeResponse(data, '请求失败')
          if (result.ok) {
            resolve(result.data)
          } else {
            app.showError(result.message, options)
            reject(result.data)
          }
        },
        fail(err) {
          app.showError('网络错误，请检查连接后重试', options)
          reject(err)
        },
        complete() {
          if (options.showLoading === true) {
            app.hideGlobalLoading()
          }
        }
      })
    })
  }
})
