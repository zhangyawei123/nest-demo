Page({
  data: {
    groups: [
      {
        id: 'daily-tools',
        title: '实用工具',
        desc: '日常高频使用的小功能',
        tools: [
          { id: 'clean-speaker', name: '手机清灰', icon: '🔊', url: '/subpackages/tools/clean-speaker/clean-speaker', enabled: true },
          { id: 'flashlight', name: '手电筒', icon: '🔦', url: '/subpackages/tools/flashlight/flashlight', enabled: true },
          { id: 'level', name: '水平仪', icon: '📐', url: '/subpackages/tools/level/level', enabled: true },
          { id: 'ruler', name: '尺子', icon: '📏', url: '/subpackages/tools/ruler/ruler', enabled: true },
          { id: 'compass', name: '指南针', icon: '🧭', url: '/subpackages/tools/compass/compass', enabled: true },
          { id: 'decibel', name: '分贝仪', icon: '📢', url: '/subpackages/tools/decibel/decibel', enabled: true },
          { id: 'qr', name: '二维码', icon: '🔳', url: '/subpackages/tools/qr/qr', enabled: true },
          { id: 'mirror', name: '化妆镜', icon: '🪞', url: '/subpackages/tools/mirror/mirror', enabled: true },
          { id: 'calc', name: '计算器', icon: '🧮', url: '/subpackages/tools/calc/calc', enabled: true }
        ]
      },
      {
        id: 'meditation-tools',
        title: '静心休憩',
        desc: '安静片刻，放松情绪',
        tools: [
          { id: 'woodfish', name: '功德木鱼', icon: '🪵', url: '/subpackages/tools/woodfish/woodfish', enabled: true },
          { id: 'singing-bowl', name: '静心颂钵', icon: '🔔', url: '/subpackages/tools/singing-bowl/singing-bowl', enabled: true }
        ]
      }
    ]
  },

  goTool(e) {
    const { url, enabled } = e.currentTarget.dataset;
    if (!enabled) {
      wx.showToast({ title: '功能开发中', icon: 'none' });
      return;
    }
    wx.navigateTo({ url });
  }
});
