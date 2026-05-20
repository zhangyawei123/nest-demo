Page({
  data: {
    version: 'v1.0.0',
    features: [
      { title: 'AI 助手', desc: '提供对话式问答与效率辅助' },
      { title: '热点内容', desc: '快速查看热门话题与精选文章' },
      { title: '实用工具', desc: '集合日常高频小工具与图片识别能力' }
    ]
  },

  copyContact() {
    wx.setClipboardData({
      data: 'NestDemo 小程序',
      success() {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  }
})
