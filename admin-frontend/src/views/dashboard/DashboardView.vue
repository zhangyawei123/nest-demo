<template>
  <div class="dashboard" v-loading="loading">
    <!-- 欢迎区域 -->
    <div class="welcome-banner">
      <div class="welcome-content">
        <div class="welcome-kicker">
          <span class="welcome-kicker-dot"></span>
          <span>Creative Center</span>
        </div>
        <h1 class="welcome-title">你好，{{ userInfo.username || '管理员' }} 👋</h1>
        <p class="welcome-desc">这里是你的创意控制台，今天的内容、权限与系统运行状态都已经同步就绪。</p>
        <div class="welcome-tags">
          <div class="welcome-tag">
            <span class="welcome-tag-label">系统状态</span>
            <span class="welcome-tag-value" :class="['status-pill', statusClass]">{{ statusText }}</span>
          </div>
          <div class="welcome-tag">
            <span class="welcome-tag-label">当前时间</span>
            <span class="welcome-tag-value">{{ currentTime }}</span>
          </div>
        </div>
      </div>

      <div class="welcome-side">
        <div class="welcome-panel welcome-panel-primary">
          <span class="welcome-panel-label">角色矩阵</span>
          <strong class="welcome-panel-value">{{ overview.stats.roleCount }}</strong>
          <span class="welcome-panel-meta">角色权限编组</span>
        </div>
        <div class="welcome-panel">
          <span class="welcome-panel-label">菜单导航</span>
          <strong class="welcome-panel-value">{{ overview.stats.menuCount }}</strong>
          <span class="welcome-panel-meta">可配置导航节点</span>
        </div>
      </div>
    </div>

    <!-- 数据卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col
        v-for="card in statCards"
        :key="card.label"
        :xs="24"
        :sm="12"
        :md="12"
        :lg="6"
      >
        <div class="stat-card" :class="`stat-card-${card.tone}`">
          <div class="stat-card-top">
            <span class="stat-badge">{{ card.badge }}</span>
            <div class="stat-icon-wrapper">
              <el-icon class="stat-icon"><component :is="card.icon" /></el-icon>
            </div>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ card.value }}</div>
            <div class="stat-label">{{ card.label }}</div>
            <div class="stat-desc">{{ card.desc }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 功能介绍 -->
    <el-row :gutter="20" class="content-row">
      <el-col :xs="24" :lg="15">
        <el-card class="feature-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-kicker">Core Modules</div>
                <div class="card-title-row">
                  <el-icon><InfoFilled /></el-icon>
                  <span>系统能力</span>
                </div>
              </div>
              <span class="card-pill">Focus</span>
            </div>
          </template>
          <div class="feature-list">
            <div
              v-for="feature in featureItems"
              :key="feature.title"
              class="feature-item"
            >
              <div class="feature-icon-wrap" :class="`feature-icon-wrap-${feature.tone}`">
                <el-icon class="feature-icon"><component :is="feature.icon" /></el-icon>
              </div>
              <div class="feature-text">
                <h4>{{ feature.title }}</h4>
                <p>{{ feature.desc }}</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="9">
        <el-card class="tech-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <div>
                <div class="card-kicker">Latest Updates</div>
                <div class="card-title-row">
                  <el-icon><Document /></el-icon>
                  <span>最近文章</span>
                </div>
              </div>
              <span class="card-pill card-pill-soft">{{ overview.recentArticles.length }} 条</span>
            </div>
          </template>
          <div class="recent-list">
            <div v-if="overview.recentArticles.length === 0" class="recent-empty">
              <div class="recent-empty-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="recent-empty-title">暂无文章数据</div>
              <div class="recent-empty-desc">发布新文章后，这里会自动显示最近更新内容。</div>
            </div>
            <div
              v-for="(article, index) in overview.recentArticles"
              :key="article.id"
              class="recent-item"
            >
              <div class="recent-index">{{ String(Number(index) + 1).padStart(2, '0') }}</div>
              <div class="recent-body">
                <div class="recent-title">{{ article.title }}</div>
                <div class="recent-meta">
                  <span>{{ article.author?.username || '未知作者' }}</span>
                  <span>{{ formatDate(article.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Document, 
  TrendCharts, 
  CircleCheck, 
  InfoFilled,
  Grid
} from '@element-plus/icons-vue'
import { getDashboardOverview } from '@/api/dashboard'

const userInfo = ref({
  username: ''
})

const loading = ref(false)
const overview = ref<any>({
  stats: {
    userCount: 0,
    articleCount: 0,
    myArticleCount: 0,
    roleCount: 0,
    menuCount: 0
  },
  recentArticles: [],
  systemStatus: ''
})

const currentTime = ref('')

const statusText = computed(() => {
  if (overview.value.systemStatus === 'online') {
    return '在线'
  }
  return overview.value.systemStatus || '-'
})

const statusClass = computed(() => (overview.value.systemStatus === 'online' ? 'status-online' : 'status-idle'))

const statCards = computed(() => [
  {
    label: '系统用户',
    value: overview.value.stats.userCount,
    desc: '统一账号与成员体系',
    badge: 'Users',
    tone: 'blue',
    icon: User,
  },
  {
    label: '文章总数',
    value: overview.value.stats.articleCount,
    desc: '内容资产持续沉淀中',
    badge: 'Posts',
    tone: 'pink',
    icon: Document,
  },
  {
    label: '我的文章',
    value: overview.value.stats.myArticleCount,
    desc: '个人创作内容统计',
    badge: 'Mine',
    tone: 'cyan',
    icon: TrendCharts,
  },
  {
    label: '运行状态',
    value: statusText.value,
    desc: '服务监控与状态同步',
    badge: 'Status',
    tone: 'green',
    icon: CircleCheck,
  },
])

const featureItems = [
  {
    title: '用户认证',
    desc: '支持登录、注册与验证码校验，保证后台入口的基本安全性。',
    tone: 'blue',
    icon: User,
  },
  {
    title: '权限治理',
    desc: '角色、菜单、用户三者联动，便于快速搭建后台访问控制体系。',
    tone: 'purple',
    icon: Grid,
  },
  {
    title: '内容管理',
    desc: '文章发布、最近更新与个人创作集中呈现，方便内容运营查看。',
    tone: 'orange',
    icon: Document,
  },
  {
    title: '系统反馈',
    desc: '通过运行状态和关键统计卡片，快速了解系统当前工作状态。',
    tone: 'green',
    icon: CircleCheck,
  },
]

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

const formatDate = (value: string) => {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN')
}

const fetchOverview = async () => {
  loading.value = true
  try {
    const res: any = await getDashboardOverview()
    overview.value = {
      stats: {
        userCount: 0,
        articleCount: 0,
        myArticleCount: 0,
        roleCount: 0,
        menuCount: 0,
        ...(res?.stats || {})
      },
      recentArticles: res?.recentArticles || [],
      systemStatus: res?.systemStatus || ''
    }
    if (res?.user?.username) {
      userInfo.value = {
        username: res.user.username
      }
    }
  } catch (error) {
    ElMessage.error('获取仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  const userInfoStr = localStorage.getItem('userInfo')
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr)
  }
  
  updateTime()
  timer = setInterval(updateTime, 1000)
  fetchOverview()
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

.welcome-banner {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 20px;
  padding: 32px;
  margin-bottom: 24px;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(118, 160, 221, 0.18);
  background:
    radial-gradient(circle at top right, rgba(124, 180, 255, 0.22), transparent 24%),
    linear-gradient(135deg, #ffffff 0%, #f6f9ff 52%, #eef4ff 100%);
  box-shadow: 0 18px 40px rgba(88, 116, 162, 0.14);
}

.welcome-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(124, 170, 230, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(124, 170, 230, 0.08) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.42), transparent 88%);
}

.welcome-content,
.welcome-side {
  position: relative;
  z-index: 1;
}

.welcome-content {
  flex: 1;
}

.welcome-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(80, 148, 255, 0.08);
  border: 1px solid rgba(80, 148, 255, 0.14);
  color: #5f7ea8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.welcome-kicker-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  box-shadow: 0 0 12px rgba(47, 145, 255, 0.3);
}

.welcome-title {
  margin: 18px 0 10px;
  color: #22324c;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.15;
}

.welcome-desc {
  max-width: 620px;
  margin: 0;
  color: #6d819f;
  font-size: 15px;
  line-height: 1.7;
}

.welcome-tags {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 24px;
}

.welcome-tag {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 180px;
  padding: 14px 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(122, 160, 211, 0.14);
  box-shadow: 0 10px 24px rgba(98, 124, 168, 0.08);
}

.welcome-tag-label {
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.welcome-tag-value {
  color: #2a3b59;
  font-size: 14px;
  font-weight: 700;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
}

.status-online {
  color: #1d8e6e;
  background: rgba(61, 217, 182, 0.14);
}

.status-idle {
  color: #6f86a8;
  background: rgba(117, 142, 176, 0.12);
}

.welcome-side {
  width: 260px;
  display: grid;
  gap: 14px;
}

.welcome-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 132px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(118, 160, 221, 0.14);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 14px 28px rgba(101, 127, 171, 0.1);
}

.welcome-panel-primary {
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.96), rgba(124, 77, 255, 0.88));
}

.welcome-panel-label {
  color: #7f95b2;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.welcome-panel-primary .welcome-panel-label,
.welcome-panel-primary .welcome-panel-value,
.welcome-panel-primary .welcome-panel-meta {
  color: #fff;
}

.welcome-panel-value {
  margin: 12px 0 6px;
  color: #22324c;
  font-size: 36px;
  line-height: 1;
}

.welcome-panel-meta {
  color: #7f91ae;
  font-size: 13px;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  position: relative;
  height: 100%;
  padding: 24px;
  border-radius: 24px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
  box-shadow: 0 16px 36px rgba(95, 124, 170, 0.12);
  transition: all 0.24s ease;
  margin-bottom: 20px;
  overflow: hidden;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 22px 42px rgba(95, 124, 170, 0.16);
}

.stat-card::after {
  content: '';
  position: absolute;
  right: -28px;
  top: -28px;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  opacity: 0.16;
}

.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(91, 127, 183, 0.08);
  color: #7d90af;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
  box-shadow: 0 12px 24px rgba(79, 120, 187, 0.18);
}

.stat-card-blue::after {
  background: linear-gradient(135deg, #53a8ff, #7c4dff);
}

.stat-card-blue .stat-icon-wrapper {
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
}

.stat-card-pink::after {
  background: linear-gradient(135deg, #ff8ab8, #ffb36b);
}

.stat-card-pink .stat-icon-wrapper {
  background: linear-gradient(135deg, #ff7db2 0%, #ff9f6e 100%);
}

.stat-card-cyan::after {
  background: linear-gradient(135deg, #45cfff, #33d6b5);
}

.stat-card-cyan .stat-icon-wrapper {
  background: linear-gradient(135deg, #2fb5ff 0%, #38d8c0 100%);
}

.stat-card-green::after {
  background: linear-gradient(135deg, #59d98f, #6bc7ff);
}

.stat-card-green .stat-icon-wrapper {
  background: linear-gradient(135deg, #41d388 0%, #4db8ff 100%);
}

.stat-content {
  flex: 1;
}

.stat-value {
  color: #22324c;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.stat-label {
  margin-top: 10px;
  color: #43536e;
  font-size: 15px;
  font-weight: 600;
}

.stat-desc {
  margin-top: 8px;
  font-size: 14px;
  color: #8ca0bc;
}

.content-row {
  margin-bottom: 24px;
}

.feature-card,
.tech-card {
  height: 100%;
  border-radius: 28px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 18px 38px rgba(95, 124, 170, 0.12) !important;
  transition: all 0.24s ease;
}

.feature-card:hover,
.tech-card:hover {
  box-shadow: 0 22px 42px rgba(95, 124, 170, 0.16) !important;
}

.feature-card :deep(.el-card__header),
.tech-card :deep(.el-card__header) {
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(122, 160, 211, 0.12);
}

.feature-card :deep(.el-card__body),
.tech-card :deep(.el-card__body) {
  padding: 22px 24px 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.card-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #243755;
  font-size: 18px;
  font-weight: 700;
}

.card-title-row .el-icon {
  color: #2f91ff;
  font-size: 18px;
}

.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
}

.card-pill-soft {
  background: rgba(106, 135, 183, 0.1);
  color: #62799e;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid rgba(122, 160, 211, 0.12);
  transition: all 0.24s ease;
}

.feature-item:hover {
  transform: translateX(4px);
  box-shadow: 0 14px 26px rgba(95, 124, 170, 0.1);
}

.feature-icon-wrap {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
}

.feature-icon-wrap-blue {
  background: rgba(47, 145, 255, 0.12);
  color: #2f91ff;
}

.feature-icon-wrap-purple {
  background: rgba(124, 77, 255, 0.12);
  color: #7c4dff;
}

.feature-icon-wrap-orange {
  background: rgba(255, 157, 84, 0.14);
  color: #ff8f4f;
}

.feature-icon-wrap-green {
  background: rgba(61, 217, 182, 0.14);
  color: #1db08f;
}

.feature-icon {
  font-size: 24px;
}

.feature-text h4 {
  margin: 0 0 6px 0;
  color: #243755;
  font-size: 16px;
  font-weight: 700;
}

.feature-text p {
  margin: 0;
  color: #7588a5;
  font-size: 13px;
  line-height: 1.7;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recent-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(122, 160, 211, 0.12);
  transition: all 0.24s ease;
}

.recent-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(95, 124, 170, 0.1);
}

.recent-index {
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 13px;
  font-weight: 700;
}

.recent-body {
  min-width: 0;
  flex: 1;
}

.recent-title {
  margin: 0 0 8px;
  color: #243755;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.5;
}

.recent-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #8ca0bc;
}

.recent-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  padding: 32px 24px;
  text-align: center;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px dashed rgba(122, 160, 211, 0.2);
}

.recent-empty-icon {
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f91ff;
  font-size: 28px;
}

.recent-empty-title {
  margin-top: 18px;
  color: #243755;
  font-size: 18px;
  font-weight: 700;
}

.recent-empty-desc {
  max-width: 240px;
  margin-top: 8px;
  color: #8ca0bc;
  font-size: 13px;
  line-height: 1.7;
}

@media (max-width: 768px) {
  .welcome-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    padding: 24px 20px;
  }

  .welcome-title {
    font-size: 28px;
  }

  .welcome-side {
    width: 100%;
  }

  .welcome-tag {
    width: 100%;
  }

  .stat-card {
    margin-bottom: 16px;
  }

  .recent-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .card-header {
    flex-direction: column;
    align-self: stretch;
    align-items: flex-start;
  }
}
</style>
