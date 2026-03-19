<template>
  <div class="dashboard">
    <!-- 欢迎区域 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <h1 class="welcome-title">你好，{{ userInfo.username }} 👋</h1>
        <p class="welcome-desc">欢迎回来，今天又是充满活力的一天！</p>
      </div>
      <div class="welcome-time">
        <el-icon class="time-icon"><Clock /></el-icon>
        <span>{{ currentTime }}</span>
      </div>
    </div>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <div class="stat-card stat-card-1">
          <div class="stat-icon-wrapper">
            <el-icon class="stat-icon"><User /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ userInfo.username }}</div>
            <div class="stat-label">当前用户</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <div class="stat-card stat-card-2">
          <div class="stat-icon-wrapper">
            <el-icon class="stat-icon"><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">2</div>
            <div class="stat-label">功能模块</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <div class="stat-card stat-card-3">
          <div class="stat-icon-wrapper">
            <el-icon class="stat-icon"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">100%</div>
            <div class="stat-label">系统健康</div>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <div class="stat-card stat-card-4">
          <div class="stat-icon-wrapper">
            <el-icon class="stat-icon"><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">在线</div>
            <div class="stat-label">运行状态</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 功能介绍 -->
    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="16">
        <el-card class="feature-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><InfoFilled /></el-icon>
              <span>系统功能</span>
            </div>
          </template>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon class="feature-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="feature-text">
                <h4>用户认证</h4>
                <p>支持用户注册、登录，集成图片验证码安全验证</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#409eff"><CircleCheck /></el-icon>
              <div class="feature-text">
                <h4>JWT 鉴权</h4>
                <p>基于 Token 的身份认证，安全可靠的会话管理</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#e6a23c"><CircleCheck /></el-icon>
              <div class="feature-text">
                <h4>用户管理</h4>
                <p>完善的用户信息查询与修改功能</p>
              </div>
            </div>
            <div class="feature-item">
              <el-icon class="feature-icon" color="#f56c6c"><CircleCheck /></el-icon>
              <div class="feature-text">
                <h4>响应式设计</h4>
                <p>适配各种屏幕尺寸，提供优质的用户体验</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="tech-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Monitor /></el-icon>
              <span>技术栈</span>
            </div>
          </template>
          <div class="tech-stack">
            <div class="tech-group">
              <h4>前端技术</h4>
              <el-tag type="primary" effect="plain">Vue 3</el-tag>
              <el-tag type="success" effect="plain">Element Plus</el-tag>
              <el-tag type="info" effect="plain">TypeScript</el-tag>
              <el-tag type="warning" effect="plain">Vite</el-tag>
            </div>
            <el-divider />
            <div class="tech-group">
              <h4>后端技术</h4>
              <el-tag type="danger" effect="plain">NestJS</el-tag>
              <el-tag type="primary" effect="plain">TypeORM</el-tag>
              <el-tag type="success" effect="plain">MySQL</el-tag>
              <el-tag type="warning" effect="plain">JWT</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  User, 
  Clock, 
  Document, 
  TrendCharts, 
  CircleCheck, 
  InfoFilled, 
  Monitor 
} from '@element-plus/icons-vue'

const userInfo = ref({
  username: ''
})

const currentTime = ref('')

// 更新时间
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

let timer: any = null

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
  
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 30px 40px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.welcome-title {
  font-size: 28px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.welcome-desc {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.welcome-time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.2);
  padding: 12px 20px;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.time-icon {
  font-size: 20px;
}

/* 统计卡片行 */
.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  margin-bottom: 20px;
  height: 100px;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.stat-card-1 .stat-icon-wrapper {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card-2 .stat-icon-wrapper {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card-3 .stat-icon-wrapper {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card-4 .stat-icon-wrapper {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

/* 内容行 */
.content-row {
  margin-bottom: 24px;
}

.feature-card,
.tech-card {
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
}

.feature-card:hover,
.tech-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
  color: #303133;
}

.card-header .el-icon {
  font-size: 18px;
  color: #667eea;
}

/* 功能列表 */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.feature-item:hover {
  background: #ecf5ff;
  transform: translateX(4px);
}

.feature-icon {
  font-size: 24px;
  margin-top: 2px;
}

.feature-text h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.feature-text p {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
}

/* 技术栈 */
.tech-stack {
  padding: 10px 0;
}

.tech-group {
  margin-bottom: 10px;
}

.tech-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.tech-group .el-tag {
  margin: 0 8px 8px 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .welcome-time {
    align-self: stretch;
    justify-content: center;
  }
}
</style>
