Page({
  data: {
    db: 0,
    barWidth: 0,
    levelText: '安静',
    levelClass: 'lv-green',
    isListening: false
  },

  recorder: null,
  frameTimer: null,

  toggle() {
    if (this.data.isListening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  },

  startListening() {
    const rec = wx.getRecorderManager();
    this.recorder = rec;

    rec.onFrameRecorded((res) => {
      if (!res.frameBuffer) return;
      const data = new Int16Array(res.frameBuffer);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
      const rms = Math.sqrt(sum / data.length);
      // 简易 dB 映射（近似值，非精准校准）
      let db = rms > 0 ? Math.round(20 * Math.log10(rms / 1) + 10) : 0;
      db = Math.max(0, Math.min(120, db));

      let levelText = '安静', levelClass = 'lv-green';
      if (db >= 90) { levelText = '⚠️ 危险'; levelClass = 'lv-red'; }
      else if (db >= 70) { levelText = '较吵'; levelClass = 'lv-orange'; }
      else if (db >= 40) { levelText = '正常'; levelClass = 'lv-yellow'; }

      this.setData({
        db,
        barWidth: Math.min(100, Math.round(db / 120 * 100)),
        levelText,
        levelClass
      });
    });

    rec.start({
      format: 'PCM',
      sampleRate: 16000,
      numberOfChannels: 1,
      frameSize: 2 // kB
    });

    this.setData({ isListening: true });
  },

  stopListening() {
    if (this.recorder) {
      this.recorder.stop();
      this.recorder = null;
    }
    this.setData({ isListening: false, db: 0, barWidth: 0, levelText: '安静', levelClass: 'lv-green' });
  },

  onHide() { this.stopListening(); },
  onUnload() { this.stopListening(); },

  onShareAppMessage() {
    return { title: '分贝仪', path: '/subpackages/tools/decibel/decibel' };
  }
});
