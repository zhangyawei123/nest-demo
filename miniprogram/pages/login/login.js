const app = getApp()
const md5 = require('../../utils/md5.js')

Page({
  data: {
    username: '',
    password: '',
    captcha: '',
    captchaId: '',
    captchaImg: '',
    loading: false
  },

  onLoad() {
    this.refreshCaptcha()
  },

  onUsernameInput(e) {
    this.setData({ username: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  onCaptchaInput(e) {
    this.setData({ captcha: e.detail.value })
  },

  refreshCaptcha() {
    app.request({ url: '/auth/captcha' }).then(res => {
      // 后端返回 { captchaId, svg }，svg 是 SVG 字符串
      // 小程序 image 不能直接渲染 SVG 字符串，转 base64 data URI
      const base64 = 'data:image/svg+xml;base64,' + wx.arrayBufferToBase64(
        new Uint8Array(Array.from(encodeURIComponent(res.svg).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1))).map(c => c.charCodeAt(0))).buffer
      )
      this.setData({
        captchaId: res.captchaId,
        captchaImg: base64
      })
    })
  },

  handleLogin() {
    const { username, password, captcha, captchaId } = this.data
    if (!username || !password) {
      wx.showToast({ title: '请输入用户名和密码', icon: 'none' })
      return
    }
    if (!captcha) {
      wx.showToast({ title: '请输入验证码', icon: 'none' })
      return
    }

    this.setData({ loading: true })
    app.request({
      url: '/auth/login',
      method: 'POST',
      data: {
        username,
        password: md5(password),
        captchaCode: captcha,
        captchaId
      }
    }).then(res => {
      const token = res.access_token || res.token
      wx.setStorageSync('token', token)
      app.globalData.token = token
      app.getUserInfo()
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.switchTab({ url: '/pages/index/index' })
      }, 500)
    }).catch(() => {
      this.refreshCaptcha()
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  handleRegister() {
    wx.showToast({ title: '请在管理后台注册', icon: 'none' })
  }
})
