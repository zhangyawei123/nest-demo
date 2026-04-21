Page({
  data: { isOn: false },

  toggle() {
    const next = !this.data.isOn;
    wx.setScreenBrightness({ value: next ? 1 : 0.5 });
    if (next) {
      wx.setKeepScreenOn({ keepScreenOn: true });
    } else {
      wx.setKeepScreenOn({ keepScreenOn: false });
    }
    this.setData({ isOn: next });
  },

  onHide() {
    if (this.data.isOn) this.toggle();
  },

  onUnload() {
    if (this.data.isOn) this.toggle();
  },

  onShareAppMessage() {
    return { title: '手电筒', path: '/subpackages/tools/flashlight/flashlight' };
  }
});
