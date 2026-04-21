const MAX_OFFSET = 120; // rpx

Page({
  data: { bubbleX: 0, bubbleY: 0, angleX: 0, angleY: 0, isLevel: false },

  onReady() {
    wx.onAccelerometerChange((res) => {
      const ax = +(res.x * 90).toFixed(1);
      const ay = +(res.y * 90).toFixed(1);
      const bx = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, res.x * MAX_OFFSET * 2));
      const by = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, -res.y * MAX_OFFSET * 2));
      this.setData({
        angleX: ax,
        angleY: ay,
        bubbleX: +bx.toFixed(0),
        bubbleY: +by.toFixed(0),
        isLevel: Math.abs(ax) < 2 && Math.abs(ay) < 2
      });
    });
    wx.startAccelerometer({ interval: 'ui' });
  },

  onUnload() { wx.stopAccelerometer(); },
  onHide() { wx.stopAccelerometer(); },
  onShow() { wx.startAccelerometer({ interval: 'ui' }); },

  onShareAppMessage() {
    return { title: '水平仪', path: '/subpackages/tools/level/level' };
  }
});
