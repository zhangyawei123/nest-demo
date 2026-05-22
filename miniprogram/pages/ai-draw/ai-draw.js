const app = getApp()

Page({
  data: {
    prompt: '自然真实视觉风格，高级奢华 ins 风现代理发店场景，一位棕色长发披肩、拥有清纯幼态脸庞的初恋甜妹类型少女，坐在专业理发椅上自拍。她穿着白色露肩毛衣，颈间佩戴精致细链项链，棕色长发柔顺有光泽、自然垂落，呈现随手一拍的手机快照质感，画面比例 9:16，人物神态自然松弛，理发店环境包含简约理发镜、理发工具、轻奢硬装等真实细节，整体为原生手机实拍质感，无过度精修，还原日常随拍的真实感。',
    model: 'gpt-image-2',
    sizeIndex: 0,
    sizes: [
      { label: '默认', value: '' },
      { label: '竖图 9:16', value: '9:16' },
      { label: '方图 1:1', value: '1:1' },
      { label: '横图 16:9', value: '16:9' }
    ],
    loading: false,
    result: null,
    imageUrls: []
  },

  onPromptInput(e) {
    this.setData({ prompt: e.detail.value })
  },

  onModelInput(e) {
    this.setData({ model: e.detail.value })
  },

  onSizeChange(e) {
    this.setData({ sizeIndex: Number(e.detail.value) })
  },

  clearPrompt() {
    if (this.data.loading) return
    this.setData({ prompt: '', result: null, imageUrls: [] })
  },

  generate() {
    const prompt = this.data.prompt.trim()
    const model = this.data.model.trim() || 'gpt-image-2'
    const size = this.data.sizes[this.data.sizeIndex].value

    if (!prompt) {
      wx.showToast({ title: '请输入生图描述', icon: 'none' })
      return
    }

    if (!app.requireLogin()) return
    if (this.data.loading) return

    this.setData({ loading: true, result: null, imageUrls: [] })

    app.request({
      url: '/draw/v1/images/generations',
      method: 'POST',
      showLoading: true,
      loadingTitle: '生成中',
      data: {
        model,
        prompt,
        image: [],
        size,
        response_format: 'url'
      }
    }).then(res => {
      const imageUrls = Array.isArray(res.data)
        ? res.data.map(item => item && item.url).filter(Boolean)
        : []
      this.setData({ result: res, imageUrls })
      if (!imageUrls.length) {
        wx.showToast({ title: '未返回图片链接', icon: 'none' })
      }
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  previewImage(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.previewImage({ current: url, urls: this.data.imageUrls })
  },

  copyUrl(e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    wx.setClipboardData({
      data: url,
      success() {
        wx.showToast({ title: '链接已复制', icon: 'success' })
      }
    })
  }
})
