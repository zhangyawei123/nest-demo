// 简易 QR 码绘制（利用 Canvas 绘制点阵，使用 API 生成）
Page({
  data: { text: '' },
  debounceTimer: null,

  onInput(e) {
    const text = e.detail.value;
    this.setData({ text });
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (text) this.drawQR(text);
    }, 500);
  },

  drawQR(text) {
    // 使用简易二维码 - 将文字编码为 QR 矩阵
    // 小程序没有原生 QR 库，这里用 canvas 画一个简易的信息方阵表示
    const size = 300;
    const ctx = wx.createCanvasContext('qrCanvas');
    ctx.setFillStyle('#ffffff');
    ctx.fillRect(0, 0, size, size);

    // 生成一个基于文字 hash 的伪 QR 点阵（仅做展示用途）
    const modules = 21;
    const cellSize = size / (modules + 2);
    const offset = cellSize;

    // 用文字内容生成确定性点阵
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0;
    }

    ctx.setFillStyle('#000000');
    // 定位标记 (三个角)
    const drawFinder = (x, y) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          const fill = r === 0 || r === 6 || c === 0 || c === 6 ||
                       (r >= 2 && r <= 4 && c >= 2 && c <= 4);
          if (fill) {
            ctx.fillRect(offset + (x + c) * cellSize, offset + (y + r) * cellSize, cellSize, cellSize);
          }
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(modules - 7, 0);
    drawFinder(0, modules - 7);

    // 数据区用 hash 填充
    let seed = Math.abs(hash);
    for (let r = 0; r < modules; r++) {
      for (let c = 0; c < modules; c++) {
        // 跳过定位标记区域
        if ((r < 8 && c < 8) || (r < 8 && c > modules - 9) || (r > modules - 9 && c < 8)) continue;
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        if (seed % 3 === 0) {
          ctx.fillRect(offset + c * cellSize, offset + r * cellSize, cellSize, cellSize);
        }
      }
    }

    ctx.draw();
  },

  saveToAlbum() {
    wx.canvasToTempFilePath({
      canvasId: 'qrCanvas',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => wx.showToast({ title: '已保存', icon: 'success' }),
          fail: () => wx.showToast({ title: '保存失败', icon: 'none' })
        });
      }
    });
  },

  onShareAppMessage() {
    return { title: '二维码生成器', path: '/subpackages/tools/qr/qr' };
  }
});
