const app = getApp()

Page({
  data: {
    sessions: [],
    currentSessionId: null,
    messages: [],
    inputText: '',
    loading: false,
    sessionsLoading: false,
    messagesLoading: false,
    streamContent: '',
    scrollToId: '',
    suggestions: [
      '帮我总结今天的热点',
      '给我一个小程序优化方案',
      '帮我写一段产品介绍',
      '解释一下 NestJS 的模块机制'
    ]
  },

  onLoad() {
    if (app.globalData.token) {
      this.loadSessions()
    }
  },

  onShow() {
    if (app.globalData.token && !this.data.sessions.length) {
      this.loadSessions()
    }
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  useSuggestion(e) {
    const text = e.currentTarget.dataset.text
    this.setData({ inputText: text })
  },

  loadSessions() {
    if (this.data.sessionsLoading) return
    this.setData({ sessionsLoading: true })
    app.request({
      url: '/ai-chat/sessions/list',
      method: 'POST',
      showLoading: false,
      silent: true
    }).then(res => {
      const sessions = res || []
      this.setData({ sessions })
      if (!this.data.currentSessionId && sessions.length) {
        this.switchSessionById(sessions[0].id)
      }
    }).catch(() => {}).finally(() => {
      this.setData({ sessionsLoading: false })
    })
  },

  startNewChat() {
    if (this.data.loading) return
    this.setData({
      currentSessionId: null,
      messages: [],
      inputText: '',
      streamContent: '',
      scrollToId: ''
    })
  },

  switchSession(e) {
    const sessionId = e.currentTarget.dataset.id
    this.switchSessionById(sessionId)
  },

  switchSessionById(sessionId) {
    if (!sessionId || this.data.loading || this.data.currentSessionId === sessionId) return
    this.setData({
      currentSessionId: sessionId,
      messages: [],
      messagesLoading: true,
      streamContent: ''
    })
    app.request({
      url: '/ai-chat/sessions/messages',
      method: 'POST',
      showLoading: false,
      data: { sessionId }
    }).then(res => {
      const messages = (res || []).map(item => ({
        id: item.id,
        role: item.role,
        content: item.content
      }))
      this.setData({ messages })
      this.scrollToBottom()
    }).finally(() => {
      this.setData({ messagesLoading: false })
    })
  },

  createSession(title) {
    return app.request({
      url: '/ai-chat/sessions/create',
      method: 'POST',
      showLoading: false,
      data: { title }
    }).then(session => {
      this.setData({
        currentSessionId: session.id,
        sessions: [session, ...this.data.sessions]
      })
      return session
    })
  },

  sendMsg() {
    const text = this.data.inputText.trim()
    if (!text || this.data.loading) return

    if (!app.requireLogin()) return

    const sendWithSession = (sessionId) => {
      const messages = [...this.data.messages, { role: 'user', content: text }]
      this.setData({
        messages,
        inputText: '',
        loading: true,
        streamContent: ''
      })
      this.scrollToBottom()

      // 小程序不支持 SSE，用普通请求
      app.request({
        url: '/ai-chat/sessions/chat-once',
        method: 'POST',
        showLoading: false,
        data: {
          sessionId,
          message: text
        }
      }).then(res => {
        const reply = res.reply || res.content || '抱歉，无法获取回复'
        const newMessages = [...messages, { role: 'assistant', content: reply }]
        this.setData({ messages: newMessages })
        this.loadSessions()
        this.scrollToBottom()
      }).catch(() => {
        const newMessages = [...messages, { role: 'assistant', content: '请求出错了，请重试' }]
        this.setData({ messages: newMessages })
      }).finally(() => {
        this.setData({ loading: false })
      })
    }

    if (this.data.currentSessionId) {
      sendWithSession(this.data.currentSessionId)
      return
    }

    this.createSession(text.length > 30 ? text.slice(0, 30) + '…' : text).then(session => {
      sendWithSession(session.id)
    }).catch(() => {})
  },

  deleteSession(e) {
    const sessionId = e.currentTarget.dataset.id
    if (!sessionId || this.data.loading) return
    wx.showModal({
      title: '提示',
      content: '确定删除这个会话吗？',
      success: (res) => {
        if (!res.confirm) return
        app.request({
          url: '/ai-chat/sessions/delete',
          method: 'POST',
          showLoading: false,
          data: { sessionId }
        }).then(() => {
          const sessions = this.data.sessions.filter(item => item.id !== sessionId)
          const nextData = { sessions }
          if (this.data.currentSessionId === sessionId) {
            nextData.currentSessionId = null
            nextData.messages = []
            nextData.scrollToId = ''
          }
          this.setData(nextData)
          wx.showToast({ title: '已删除', icon: 'success' })
        })
      }
    })
  },

  renameSession(e) {
    const sessionId = e.currentTarget.dataset.id
    const title = e.detail.value.trim()
    if (!sessionId || !title) return
    app.request({
      url: '/ai-chat/sessions/update-title',
      method: 'POST',
      showLoading: false,
      data: {
        sessionId,
        title
      }
    }).then(() => this.loadSessions())
  },

  copyMessage(e) {
    const content = e.currentTarget.dataset.content
    if (!content) return
    wx.setClipboardData({
      data: content,
      success() {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  clearMessages() {
    if (!this.data.messages.length || this.data.loading) return
    wx.showModal({
      title: '提示',
      content: '确定要清空当前对话吗？',
      success: (res) => {
        if (res.confirm) {
          if (!this.data.currentSessionId) {
            this.setData({ messages: [], scrollToId: '' })
            return
          }
          app.request({
            url: '/ai-chat/sessions/delete',
            method: 'POST',
            showLoading: false,
            data: { sessionId: this.data.currentSessionId }
          }).then(() => {
            const sessions = this.data.sessions.filter(item => item.id !== this.data.currentSessionId)
            this.setData({
              sessions,
              currentSessionId: null,
              messages: [],
              scrollToId: ''
            })
          })
        }
      }
    })
  },

  scrollToBottom() {
    const len = this.data.messages.length
    this.setData({ scrollToId: this.data.loading ? 'msg-loading' : 'msg-' + (len - 1) })
  }
})
