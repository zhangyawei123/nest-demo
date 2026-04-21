// 不同频率（Hz）
const FREQ_MAP = {
  low: 165,
  mid: 480,
  high: 3000
};

// 清理时长 30 秒
const CLEAN_DURATION = 30;

// 采样率
const SAMPLE_RATE = 44100;
// 生成一段指定频率的 PCM WAV buffer（duration 秒）
function generateWav(freq, duration) {
  const numSamples = SAMPLE_RATE * duration;
  const dataSize = numSamples * 2; // 16-bit mono
  const fileSize = 44 + dataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // WAV header
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM samples – sine wave
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.sin(2 * Math.PI * freq * i / SAMPLE_RATE);
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return buffer;
}

// 把 ArrayBuffer 写入临时文件并返回路径
function writeWavFile(freq) {
  return new Promise((resolve, reject) => {
    const buf = generateWav(freq, 5); // 5 秒文件，循环播放
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/clean_${freq}hz.wav`;
    fs.writeFile({
      filePath,
      data: buf,
      encoding: 'binary',
      success: () => resolve(filePath),
      fail: reject
    });
  });
}

Page({
  data: {
    currentFreq: 'mid',
    isPlaying: false,
    progress: 0,
    progressText: ''
  },

  audioCtx: null,
  timer: null,
  elapsed: 0,
  wavCache: {},

  selectFreq(e) {
    const freq = e.currentTarget.dataset.freq;
    const wasPlaying = this.data.isPlaying;
    if (wasPlaying) this.stopClean();
    this.setData({ currentFreq: freq });
    if (wasPlaying) this.startClean();
  },

  togglePlay() {
    if (this.data.isPlaying) {
      this.stopClean();
    } else {
      this.startClean();
    }
  },

  async startClean() {
    const freqKey = this.data.currentFreq;
    const hz = FREQ_MAP[freqKey];

    // 生成/缓存 wav 文件
    if (!this.wavCache[freqKey]) {
      wx.showLoading({ title: '准备中...' });
      try {
        this.wavCache[freqKey] = await writeWavFile(hz);
      } catch (err) {
        console.error('生成音频失败', err);
        wx.hideLoading();
        wx.showToast({ title: '音频生成失败', icon: 'none' });
        return;
      }
      wx.hideLoading();
    }

    const ctx = wx.createInnerAudioContext();
    ctx.src = this.wavCache[freqKey];
    ctx.loop = true;
    ctx.volume = 1;
    ctx.play();
    this.audioCtx = ctx;
    this.elapsed = 0;

    ctx.onError((err) => {
      console.error('音频播放失败', err);
      wx.showToast({ title: '播放失败，请重试', icon: 'none' });
      this.stopClean();
    });

    this.setData({ isPlaying: true, progress: 0, progressText: `0 / ${CLEAN_DURATION}s` });

    this.timer = setInterval(() => {
      this.elapsed++;
      const pct = Math.min(Math.round((this.elapsed / CLEAN_DURATION) * 100), 100);
      this.setData({
        progress: pct,
        progressText: `${this.elapsed} / ${CLEAN_DURATION}s`
      });
      if (this.elapsed >= CLEAN_DURATION) {
        this.stopClean();
        wx.showToast({ title: '清理完成 🎉', icon: 'success' });
        wx.vibrateShort({ type: 'heavy' });
      }
    }, 1000);
  },

  stopClean() {
    if (this.audioCtx) {
      this.audioCtx.stop();
      this.audioCtx.destroy();
      this.audioCtx = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.setData({ isPlaying: false, progress: 0, progressText: '' });
  },

  onUnload() {
    this.stopClean();
  },

  onHide() {
    this.stopClean();
  },

  onShareAppMessage() {
    return {
      title: '手机喇叭灰尘清理神器',
      path: '/pages/clean-speaker/clean-speaker'
    };
  }
});