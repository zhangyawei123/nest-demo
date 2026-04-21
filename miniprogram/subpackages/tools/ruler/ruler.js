Page({
  data: { reading: 0, maxCm: 15 },

  onReady() {
    const query = wx.createSelectorQuery();
    query.select('.ruler-canvas').boundingClientRect((rect) => {
      if (!rect) return;
      this.canvasH = rect.height;
      this.pxPerCm = rect.height / (this.data.maxCm + 1);
      this.drawRuler();
    }).exec();
  },

  drawRuler() {
    const ctx = wx.createCanvasContext('rulerCanvas');
    const w = 80;
    const ppc = this.pxPerCm;
    ctx.setFillStyle('#2e7d32');
    ctx.fillRect(0, 0, 300, this.canvasH);

    for (let mm = 0; mm <= this.data.maxCm * 10; mm++) {
      const y = mm * ppc / 10;
      const isCm = mm % 10 === 0;
      const isHalf = mm % 5 === 0;
      const len = isCm ? 60 : isHalf ? 40 : 24;
      ctx.beginPath();
      ctx.setStrokeStyle('rgba(255,255,255,0.8)');
      ctx.setLineWidth(isCm ? 2 : 1);
      ctx.moveTo(0, y);
      ctx.lineTo(len, y);
      ctx.stroke();
      if (isCm) {
        ctx.setFontSize(12);
        ctx.setFillStyle('#fff');
        ctx.fillText(`${mm / 10}`, len + 6, y + 4);
      }
    }
    ctx.draw();
  },

  onSlider(e) {
    this.setData({ reading: e.detail.value });
  },

  onShareAppMessage() {
    return { title: '尺子', path: '/subpackages/tools/ruler/ruler' };
  }
});
