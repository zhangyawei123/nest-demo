const SAMPLE_RATE = 44100;
const cache = {};

function clamp(value) {
  if (value > 1) return 1;
  if (value < -1) return -1;
  return value;
}

function pseudoNoise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453123;
  return (x - Math.floor(x)) * 2 - 1;
}

function renderWavBuffer(duration, sampleAt) {
  const numSamples = Math.floor(SAMPLE_RATE * duration);
  const dataSize = numSamples * 2;
  const fileSize = 44 + dataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, fileSize - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const sample = clamp(sampleAt(t, i, duration));
    view.setInt16(44 + i * 2, sample * 32767, true);
  }

  return buffer;
}

function ensureWavFile(key, duration, sampleAt) {
  if (cache[key]) {
    return Promise.resolve(cache[key]);
  }

  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager();
    const filePath = `${wx.env.USER_DATA_PATH}/${key}.wav`;
    const buffer = renderWavBuffer(duration, sampleAt);

    fs.writeFile({
      filePath,
      data: buffer,
      success: () => {
        cache[key] = filePath;
        resolve(filePath);
      },
      fail: reject
    });
  });
}

function createWoodfishFile() {
  return ensureWavFile('woodfish_strike', 1.2, (t, i) => {
    const attack = Math.min(1, t / 0.004);
    const bodyEnv = Math.exp(-7.5 * t);
    const clickEnv = Math.exp(-85 * t);
    const low = Math.sin(2 * Math.PI * 230 * t + 0.08) * 0.12;
    const body =
      Math.sin(2 * Math.PI * 620 * t) * 0.42 +
      Math.sin(2 * Math.PI * 910 * t + 0.1) * 0.28 +
      Math.sin(2 * Math.PI * 1280 * t + 0.18) * 0.16;
    const click = pseudoNoise(i) * 0.18;
    return attack * (body * bodyEnv + low * Math.exp(-9 * t) + click * clickEnv);
  });
}

function createBowlStrikeFile() {
  return ensureWavFile('singing_bowl_strike', 8, (t, i) => {
    const attack = 1 - Math.exp(-25 * t);
    const env1 = Math.exp(-0.65 * t);
    const env2 = Math.exp(-0.9 * t);
    const env3 = Math.exp(-1.15 * t);
    const shimmer = Math.sin(2 * Math.PI * 7 * t) * 0.012;
    const tone =
      Math.sin(2 * Math.PI * 432 * t + shimmer) * 0.34 * env1 +
      Math.sin(2 * Math.PI * 648 * t + 0.25) * 0.22 * env2 +
      Math.sin(2 * Math.PI * 864 * t + 0.48) * 0.15 * env2 +
      Math.sin(2 * Math.PI * 1080 * t + 0.18) * 0.1 * env3;
    const strike = pseudoNoise(i) * 0.06 * Math.exp(-42 * t);
    return attack * (tone + strike);
  });
}

function createMeditationLoopFile() {
  return ensureWavFile('meditation_loop', 12, (t, i, duration) => {
    const slowLfo = 0.65 + 0.35 * Math.sin(2 * Math.PI * t / duration);
    const drone =
      Math.sin(2 * Math.PI * 144 * t) * 0.12 +
      Math.sin(2 * Math.PI * 216 * t + 0.2 * Math.sin(2 * Math.PI * 0.08 * t)) * 0.08 +
      Math.sin(2 * Math.PI * 288 * t + 0.15) * 0.05;

    const pulseTimes = [0, 4, 8];
    let pulse = 0;
    for (let p = 0; p < pulseTimes.length; p++) {
      const dt = t - pulseTimes[p];
      if (dt >= 0) {
        pulse +=
          Math.sin(2 * Math.PI * 396 * dt) * 0.11 * Math.exp(-1.4 * dt) +
          Math.sin(2 * Math.PI * 594 * dt + 0.1) * 0.08 * Math.exp(-1.8 * dt);
      }
    }

    const air = pseudoNoise(i) * 0.008 * (0.5 + 0.5 * Math.sin(2 * Math.PI * 0.06 * t));
    const fade = Math.sin(Math.PI * t / duration);
    return (drone * slowLfo + pulse + air) * fade;
  });
}

module.exports = {
  createWoodfishFile,
  createBowlStrikeFile,
  createMeditationLoopFile
};
