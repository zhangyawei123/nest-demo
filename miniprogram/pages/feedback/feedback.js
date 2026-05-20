const app = getApp()

Page({
  data: {
    type: '功能建议',
    content: '',
    contact: '',
    submitting: false,
    types: ['功能建议', '体验问题', '内容反馈', '其他']
  },

  onTypeChange(e) {
    this.setData({ type: this.data.types[e.detail.value] })
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value })
  },

  onContactInput(e) {
    this.setData({ contact: e.detail.value })
  },

  submitFeedback() {
    const content = this.data.content.trim()
    if (!content) {
      wx.showToast({ title: '请填写反馈内容', icon: 'none' })
      return
    }
    if (!app.requireLogin()) return
    if (this.data.submitting) return

    this.setData({ submitting: true })
    app.request({
      url: '/feedback/create',
      method: 'POST',
      showLoading: false,
      data: {
        type: this.data.type,
        content,
        contact: this.data.contact.trim()
      }
    }).then(() => {
      wx.showToast({ title: '已收到反馈', icon: 'success' })
      this.setData({ content: '', contact: '' })
    }).finally(() => {
      this.setData({ submitting: false })
    })
  }
})
