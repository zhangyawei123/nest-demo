const app = getApp()

const COLORS = ['#FF6B6B', '#FF9F43', '#FECA57', '#48DBFB', '#1DD1A1', '#54A0FF', '#5F27CD', '#FF78C4']

Page({
  data: {
    prizes: [],
    spinning: false,
    showResult: false,
    resultPrize: {}
  },

  _rotation: 0,
  _canvas: null,
  _ctx: null,
  _dpr: 1,
  _animTimer: null,

  onLoad() {
    this.loadPrizes()
  },

  onReady() {
    this.initCanvas()
  },

  loadPrizes() {
    app.request({ url: '/lottery/prizes' }).then(res => {
      const prizes = res || []
      this.setData({ prizes })
      if (this._ctx) {
        this.drawWheel(this._rotation)
      }
    })
  },

  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#wheelCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res || !res[0] || !res[0].node) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getWindowInfo().pixelRatio || 1
      const size = 300
      canvas.width = size * dpr
      canvas.height = size * dpr
      ctx.scale(dpr, dpr)
      this._canvas = canvas
      this._ctx = ctx
      this._dpr = dpr
      this.drawWheel(this._rotation)
    })
  },

  drawWheel(rotationDeg = 0) {
    const ctx = this._ctx
    const prizes = this.data.prizes
    if (!ctx) return
    const size = 300
    const cx = 150
    const cy = 150
    const r = 140
    ctx.clearRect(0, 0, size, size)

    if (prizes.length) {
      const angle = (Math.PI * 2) / prizes.length

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rotationDeg * Math.PI / 180)
      ctx.translate(-cx, -cy)

      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.15)'
      ctx.shadowBlur = 14
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.restore()

      let startAngle = -Math.PI / 2
      prizes.forEach((prize, idx) => {
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startAngle, startAngle + angle)
        ctx.closePath()
        ctx.fillStyle = prize.color || COLORS[idx % COLORS.length]
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startAngle + angle / 2)
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        const tr = r * 0.75
        if (prize.icon) {
          ctx.font = '18px sans-serif'
          ctx.fillText(prize.icon, tr - 2, -6)
        }
        ctx.font = 'bold 12px sans-serif'
        const name = (prize.name || '').length > 5 ? prize.name.slice(0, 5) + '…' : (prize.name || '')
        ctx.fillText(name, tr - 2, prize.icon ? 12 : 5)
        ctx.restore()

        startAngle += angle
      })

      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 5
      ctx.stroke()

      ctx.restore()
    }

    const gradient = ctx.createRadialGradient(cx, cy, 8, cx, cy, 42)
    gradient.addColorStop(0, '#ff8f8f')
    gradient.addColorStop(1, '#e6413e')
    ctx.beginPath()
    ctx.arc(cx, cy, 42, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 15px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(this.data.spinning ? '...' : '抽奖', cx, cy)
  },

  animateRotation(start, end, duration, onComplete) {
    if (this._animTimer) {
      clearTimeout(this._animTimer)
    }
    const startTime = Date.now()
    const step = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = start + (end - start) * eased
      this.drawWheel(current)
      if (progress < 1) {
        this._animTimer = setTimeout(step, 16)
        return
      }
      this._rotation = end
      this.drawWheel(end)
      if (onComplete) {
        onComplete()
      }
    }
    step()
  },

  handleDraw() {
    if (this.data.spinning) return
    if (!this.data.prizes.length) {
      wx.showToast({ title: '暂无奖项', icon: 'none' })
      return
    }

    this.setData({ spinning: true })
    this.drawWheel(this._rotation)

    app.request({ url: '/lottery/draw', method: 'POST' }).then(res => {
      const prize = res.prize || res
      const index = res.index !== undefined ? res.index : 0
      const count = this.data.prizes.length
      const sliceAngle = 360 / count
      const targetAngle = index * sliceAngle + sliceAngle / 2
      const extraTurns = 360 * 8
      const normalized = ((this._rotation % 360) + 360) % 360
      const targetRotation = this._rotation + extraTurns + (360 - targetAngle) - normalized

      this.animateRotation(this._rotation, targetRotation, 5000, () => {
        this.setData({
          spinning: false,
          showResult: true,
          resultPrize: prize
        })
        this.drawWheel(this._rotation)
      })
    }).catch(() => {
      this.setData({ spinning: false })
      this.drawWheel(this._rotation)
    })
  },

  closeResult() {
    this.setData({ showResult: false })
  },

  onUnload() {
    if (this._animTimer) {
      clearTimeout(this._animTimer)
    }
  }
})
