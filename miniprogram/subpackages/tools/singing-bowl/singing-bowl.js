 const { createBowlStrikeFile, createMeditationLoopFile } = require('../../../utils/audio-synth');

Page({
  data: {
    playing: false,
    loopPlaying: false
  },

  strikeCtx: null,
  loopCtx: null,
  strikeSrc: '',
  loopSrc: '',
  preparing: null,

  onLoad() {
    this.prepareAudio();
  },

  async prepareAudio() {
    if (this.strikeSrc && this.loopSrc) {
      return { strikeSrc: this.strikeSrc, loopSrc: this.loopSrc };
    }
    if (this.preparing) {
      return this.preparing;
    }

    this.preparing = Promise.all([createBowlStrikeFile(), createMeditationLoopFile()])
      .then(([strikeSrc, loopSrc]) => {
        this.strikeSrc = strikeSrc;
        this.loopSrc = loopSrc;
        return { strikeSrc, loopSrc };
      })
      .finally(() => {
        this.preparing = null;
      });

    return this.preparing;
  },

  async playStrikeSound() {
    try {
      const { strikeSrc } = await this.prepareAudio();
      if (!this.strikeCtx) {
        this.strikeCtx = wx.createInnerAudioContext();
        this.strikeCtx.autoplay = false;
      }
      this.strikeCtx.src = strikeSrc;
      this.strikeCtx.stop();
      this.strikeCtx.seek(0);
      this.strikeCtx.play();
    } catch (error) {
      wx.showToast({ title: '颂钵音加载失败', icon: 'none' });
    }
  },

  async startMeditationLoop() {
    try {
      const { loopSrc } = await this.prepareAudio();
      if (!this.loopCtx) {
        this.loopCtx = wx.createInnerAudioContext();
        this.loopCtx.autoplay = false;
        this.loopCtx.loop = true;
        this.loopCtx.volume = 0.75;
      }
      this.loopCtx.src = loopSrc;
      this.loopCtx.play();
      this.setData({ loopPlaying: true });
      wx.showToast({ title: '冥想音已开启', icon: 'success' });
    } catch (error) {
      wx.showToast({ title: '冥想音加载失败', icon: 'none' });
    }
  },

  stopMeditationLoop() {
    if (this.loopCtx) {
      this.loopCtx.stop();
    }
    this.setData({ loopPlaying: false });
  },

  strikeBowl() {
    this.setData({ playing: true });
    this.playStrikeSound();
    wx.vibrateShort({ type: 'medium' });
    setTimeout(() => {
      this.setData({ playing: false });
    }, 1200);
  },

  toggleLoop() {
    if (this.data.loopPlaying) {
      this.stopMeditationLoop();
      wx.showToast({ title: '冥想音已关闭', icon: 'none' });
    } else {
      this.startMeditationLoop();
    }
  },

  clearAudio() {
    if (this.strikeCtx) {
      this.strikeCtx.stop();
      this.strikeCtx.destroy();
      this.strikeCtx = null;
    }
    if (this.loopCtx) {
      this.loopCtx.stop();
      this.loopCtx.destroy();
      this.loopCtx = null;
    }
  },

  onHide() {
    this.clearAudio();
    this.setData({ loopPlaying: false, playing: false });
  },

  onUnload() {
    this.clearAudio();
  },

  onShareAppMessage() {
    return { title: '静心颂钵', path: '/subpackages/tools/singing-bowl/singing-bowl' };
  }
});
