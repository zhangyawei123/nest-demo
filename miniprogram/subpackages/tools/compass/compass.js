const DIRS = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];

Page({
  data: { degree: 0, direction: '北' },

  onReady() {
    wx.onCompassChange((res) => {
      const d = Math.round(res.direction);
      const idx = Math.round(d / 45) % 8;
      this.setData({ degree: d, direction: DIRS[idx] });
    });
    wx.startCompass({ interval: 'ui' });
  },

  onUnload() { wx.stopCompass(); },
  onHide() { wx.stopCompass(); },
  onShow() { wx.startCompass({ interval: 'ui' }); },

  onShareAppMessage() {
    return { title: '指南针', path: '/subpackages/tools/compass/compass' };
  }
});
