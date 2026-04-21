 const { createWoodfishFile } = require('../../../utils/audio-synth');

Page({
  data: {
    count: 0,
    hitting: false,
    showFloat: false
  },

  audioCtx: null,
  woodfishSrc: '',
  preparing: null,

  onLoad() {
    const count = Number(wx.getStorageSync('woodfish_count') || 0);
    this.setData({ count });
    this.prepareWoodfishAudio();
  },

  async prepareWoodfishAudio() {
    if (this.woodfishSrc) {
      return this.woodfishSrc;
    }
    if (this.preparing) {
      return this.preparing;
    }

    this.preparing = createWoodfishFile()
      .then((src) => {
        this.woodfishSrc = src;
        return src;
      })
      .finally(() => {
        this.preparing = null;
      });

    return this.preparing;
  },

  async playWoodfishSound() {
    try {
      const src = await this.prepareWoodfishAudio();
      if (!this.audioCtx) {
        this.audioCtx = wx.createInnerAudioContext();
        this.audioCtx.autoplay = false;
      }
      this.audioCtx.src = src;
      this.audioCtx.stop();
      this.audioCtx.seek(0);
      this.audioCtx.play();
    } catch (error) {
      wx.showToast({ title: '木鱼音加载失败', icon: 'none' });
    }
  },

  hitWoodfish() {
    const next = this.data.count + 1;
    wx.setStorageSync('woodfish_count', next);
    this.setData({ count: next, hitting: true, showFloat: true });
    this.playWoodfishSound();
    wx.vibrateShort({ type: 'light' });
    wx.showToast({ title: '功德 +1', icon: 'none' });

    setTimeout(() => {
      this.setData({ hitting: false });
    }, 180);

    setTimeout(() => {
      this.setData({ showFloat: false });
    }, 900);
  },

  resetCount() {
    wx.removeStorageSync('woodfish_count');
    this.setData({ count: 0 });
    wx.showToast({ title: '已清零', icon: 'success' });
  },

  clearAudio() {
    if (this.audioCtx) {
      this.audioCtx.stop();
      this.audioCtx.destroy();
      this.audioCtx = null;
    }
  },

  onHide() {
    this.clearAudio();
  },

  onUnload() {
    this.clearAudio();
  },

  onShareAppMessage() {
    return { title: '功德木鱼', path: '/subpackages/tools/woodfish/woodfish' };
  }
});
