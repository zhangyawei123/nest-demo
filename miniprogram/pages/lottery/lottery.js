const app = getApp()

Page({
  data: {
    prizes: [],
    showResult: false,
    resultPrize: {},
    isDrawing: false
  },

  onLoad() {
    this.loadPrizes()
  },

  onReady() {
    this.drawWheel()
  },

  loadPrizes() {
    app.request({ url: '/lottery/prizes' }).then(res => {
      this.setData({ prizes: res || [] })
      setTimeout(() => this.drawWheel(), 100)
    })
  },

  drawWheel() {
    const query = wx.createSelectorQuery()
    query.select('#wheelCanvas').fields({ node: true, size: true }).exec((res) => {
      if (!res[0]) return
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      const dpr = wx.getWindowInfo().pixelRatio
      canvas.width = 300 * dpr
      canvas.height = 300 * dpr
      ctx.scale(dpr, dpr)

      const prizes = this.data.prizes
      if (!prizes.length) return

      const cx = 150, cy = 150, r = 140
      const count = prizes.length
      const arc = (Math.PI * 2) / count

      prizes.forEach((prize, i) => {
        const startAngle = arc * i - Math.PI / 2
        const endAngle = startAngle + arc

        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.arc(cx, cy, r, startAngle, endAngle)
        ctx.closePath()
        ctx.fillStyle = prize.color || ['#FF6B6B','#FF9F43','#FECA57','#48DBFB','#1DD1A1','#54A0FF'][i % 6]
        ctx.fill()

        // 文字
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(startAngle + arc / 2)
        ctx.fillStyle = '#fff'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(prize.icon || '🎁', r * 0.6, 4)
        ctx.font = '10px sans-serif'
        ctx.fillText(prize.name, r * 0.38, 4)
        ctx.restore()
      })

      // 外圈
      ctx.beginPath()
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2)
      ctx.lineWidth = 3
      ctx.strokeStyle = '#e4e7ed'
      ctx.stroke()
    })
  },

  handleDraw() {
    if (this.data.isDrawing) return
    this.setData({ isDrawing: true })

    app.request({ url: '/lottery/draw', method: 'POST' }).then(res => {
      const prize = res.prize || res
      this.setData({
        showResult: true,
        resultPrize: prize,
        isDrawing: false
      })
    }).catch(() => {
      this.setData({ isDrawing: false })
    })
  },

  closeResult() {
    this.setData({ showResult: false })
  }
})
