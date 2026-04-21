Page({
  data: { brightness: 0.7 },

  onReady() {
    wx.setKeepScreenOn({ keepScreenOn: true });
    wx.setScreenBrightness({ value: this.data.brightness });
  },

  setBrightness(e) {
    const val = +e.currentTarget.dataset.val;
    wx.setScreenBrightness({ value: val });
    this.setData({ brightness: val });
  },

  onUnload() {
    wx.setKeepScreenOn({ keepScreenOn: false });
    wx.setScreenBrightness({ value: 0.5 });
  },

  onHide() {
    wx.setKeepScreenOn({ keepScreenOn: false });
  },

  onShareAppMessage() {
    return { title: '化妆镜', path: '/subpackages/tools/mirror/mirror' };
  }
});
