<template>
  <main class="studio-page">
    <aside class="studio-sidebar">
      <RouterLink class="brand studio-brand" to="/">
        <span class="brand-mark studio-brand-mark"></span>
        <span>
          <strong>Nebula AI</strong>
          <small>创作工作台</small>
        </span>
      </RouterLink>

      <nav class="studio-nav">
        <el-button
          v-for="item in navItems"
          :key="item.key"
          :class="{ active: activePanel === item.key }"
          text
          class="full-button"
          @click="activePanel = item.key"
        >
          <el-icon class="nav-icon"><component :is="item.icon" /></el-icon>
          <span class="nav-label">{{ item.label }}</span>
        </el-button>
      </nav>

      <section class="sidebar-balance">
        <div class="balance-heading">
          <span class="balance-caption">可用积分</span>
          <el-icon><Coin /></el-icon>
        </div>
        <div class="balance-value">{{ pointsBalanceText }}</div>
        <div class="balance-cost">聊天 {{ costText(pointsProfile.costs.aiChat) }} · 生图 {{ costText(pointsProfile.costs.drawGeneration) }}</div>
        <button type="button" @click="activePanel = 'recharge'">充值积分</button>
      </section>
    </aside>

    <section class="studio-main">
      <header class="studio-topbar">
        <div class="topbar-title">
          <h1>{{ panelTitle }}</h1>
          <span>{{ panelDescription }}</span>
        </div>
        <div class="topbar-actions">
          <el-button class="sign-in-button" :disabled="pointsProfile.signedInToday" :loading="signingIn" @click="handleSignIn">
            <el-icon><Calendar /></el-icon>
            {{ pointsProfile.signedInToday ? '今日已签到' : signingIn ? '签到中' : `签到 +${pointsProfile.todaySignInPoints}` }}
          </el-button>
          <span class="user-chip"><el-icon><User /></el-icon>{{ username }}</span>
          <el-tooltip content="退出登录" placement="bottom">
            <el-button class="logout-button" circle aria-label="退出登录" @click="logout"><el-icon><SwitchButton /></el-icon></el-button>
          </el-tooltip>
        </div>
      </header>

      <section v-if="activePanel === 'overview'" class="studio-panel overview-panel">
        <div class="overview-summary">
          <div class="overview-welcome">
            <span class="section-label">创作概览</span>
            <h2>你好，{{ username }}</h2>
            <p>选择一个工具开始创作，作品会自动保存到历史记录。</p>
            <div class="quick-actions">
              <el-button type="primary" @click="activePanel = 'chat'"><el-icon><ChatDotRound /></el-icon>开始聊天</el-button>
              <el-button @click="activePanel = 'draw'"><el-icon><Picture /></el-icon>生成图片</el-button>
              <el-button text @click="activePanel = 'works'"><el-icon><Collection /></el-icon>查看作品</el-button>
            </div>
          </div>
          <div class="overview-metrics">
            <div class="metric-primary">
              <span>当前积分</span>
              <strong>{{ pointsBalanceText }}</strong>
            </div>
            <div>
              <span>连续签到</span>
              <strong>{{ pointsProfile.currentStreak }} 天</strong>
            </div>
            <div>
              <span>补签机会</span>
              <strong>{{ pointsProfile.isUnlimited ? '无限' : pointsProfile.makeupSignInChances }} 次</strong>
            </div>
          </div>
        </div>

        <div class="overview-grid">
          <el-card class="plain-section" shadow="never">
            <div class="section-heading compact">
              <div>
                <span class="section-label">本月签到</span>
                <h2>积分日历</h2>
              </div>
              <span class="muted-text">补签机会 {{ pointsCalendar.makeupSignInChances }}</span>
            </div>
            <div class="calendar-grid">
              <span v-for="dayName in weekNames" :key="dayName" class="calendar-week">{{ dayName }}</span>
              <span v-for="blank in calendarLeadingBlanks" :key="`blank-${blank}`" class="calendar-blank"></span>
              <button
                v-for="day in pointsCalendar.days"
                :key="day.date"
                type="button"
                :class="['calendar-day', { signed: day.signedIn, today: day.isToday, makeup: day.isMakeup }]"
                :disabled="!canMakeup(day.date, day.signedIn, day.isPast)"
                @click="handleMakeup(day.date)"
              >
                <span>{{ day.day }}</span>
                <small>{{ day.signedIn ? (day.isMakeup ? '补签' : `+${day.points}`) : day.isPast ? '可补' : '' }}</small>
              </button>
            </div>
          </el-card>

          <el-card class="plain-section" shadow="never">
            <div class="section-heading compact">
              <div>
                <span class="section-label">账户动态</span>
                <h2>积分流水</h2>
              </div>
            </div>
            <div class="ledger-list">
              <div v-for="log in pointLogs" :key="log.id" class="ledger-row">
                <div>
                  <strong>{{ log.description || sceneLabel(log.scene) }}</strong>
                  <span>{{ formatTime(log.createdAt) }}</span>
                </div>
                <em :class="{ positive: log.amount > 0 }">{{ log.amount > 0 ? '+' : '' }}{{ log.amount }}</em>
              </div>
              <p v-if="!pointLogs.length && !loading" class="empty-text">暂无积分流水</p>
            </div>
          </el-card>
        </div>
      </section>

      <section v-if="activePanel === 'chat'" class="studio-panel chat-panel">
        <aside class="chat-sessions">
          <el-button type="primary" class="full-button new-session" @click="handleCreateSession"><el-icon><Plus /></el-icon>新建对话</el-button>
          <el-button
            v-for="session in sessions"
            :key="session.id"
            text
            class="full-button"
            :class="{ active: currentSessionId === session.id }"
            @click="selectSession(session.id)"
          >
            <span>{{ session.title || `会话 #${session.id}` }}</span>
            <small>{{ formatDate(session.updatedAt) }}</small>
          </el-button>
        </aside>

        <div class="chat-workspace">
          <div ref="chatScrollRef" class="message-list">
            <article v-for="message in messages" :key="message.id" :class="['message-bubble', message.role]">
              <span>{{ message.role === 'assistant' ? 'AI' : '我' }}</span>
              <p>{{ message.content }}</p>
            </article>
            <article v-if="streamingReply" class="message-bubble assistant">
              <span>AI</span>
              <p>{{ streamingReply }}</p>
            </article>
            <p v-if="!messages.length && !streamingReply" class="empty-text">
              选择或新建一个对话，{{ pointsProfile.isUnlimited ? '管理员免费使用。' : `发送后消耗 ${pointsProfile.costs.aiChat} 积分。` }}
            </p>
          </div>

          <form class="chat-composer" @submit.prevent="handleSendMessage">
            <el-input
              v-model="chatInput"
              type="textarea"
              placeholder="输入你的问题、文案需求或创作想法"
              :autosize="{ minRows: 3, maxRows: 6 }"
            />
            <el-button native-type="submit" type="primary" :loading="chatSending" :disabled="!chatInput">
            <el-icon v-if="!chatSending"><Promotion /></el-icon>
            {{ chatSending ? '回复中' : pointsProfile.isUnlimited ? '发送' : `发送 -${pointsProfile.costs.aiChat}` }}
            </el-button>
          </form>
        </div>
      </section>

      <section v-if="activePanel === 'draw'" class="studio-panel draw-panel">
        <el-card class="draw-composer" shadow="never">
          <el-form class="draw-form" label-position="top" @submit.prevent="handleGenerate">
            <el-form-item label="模型">
              <el-input v-model="drawForm.model" placeholder="draw-image" />
            </el-form-item>
            <el-form-item label="尺寸">
              <el-select v-model="drawForm.size">
                <el-option
                  v-for="option in drawSizeOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="清晰度">
              <el-select v-model="drawForm.resolution">
                <el-option
                  v-for="option in drawResolutionOptions"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="数量">
              <el-input-number v-model="drawForm.count" :min="1" :max="5" />
            </el-form-item>
            <el-form-item label="描述词">
              <el-input
                v-model="drawForm.prompt"
                type="textarea"
                placeholder="描述你想生成的图片，越具体越稳定"
                :autosize="{ minRows: 7, maxRows: 12 }"
              />
            </el-form-item>
            <el-button native-type="submit" type="primary" class="full-button" :loading="drawLoading" :disabled="!drawForm.prompt">
            <el-icon v-if="!drawLoading"><MagicStick /></el-icon>
            {{ drawLoading ? '生成中' : pointsProfile.isUnlimited ? '开始生图' : `开始生图 -${pointsProfile.costs.drawGeneration}` }}
            </el-button>
          </el-form>
        </el-card>

        <el-card class="draw-result" shadow="never">
          <div class="section-heading compact">
            <div>
              <span class="section-label">实时预览</span>
              <h2>生成结果</h2>
            </div>
            <el-tooltip content="刷新历史" placement="bottom">
              <el-button circle aria-label="刷新历史" @click="loadDrawHistory"><el-icon><Refresh /></el-icon></el-button>
            </el-tooltip>
          </div>
          <div v-if="drawResultUrls.length" class="image-grid">
            <a v-for="(url, index) in drawResultUrls" :key="url + index" :href="url" target="_blank" rel="noopener" class="image-tile">
              <img :src="url" alt="生成结果" />
            </a>
          </div>
          <p v-else class="empty-text">生成完成后会展示图片，并同步保存到自己的服务器历史记录。</p>
        </el-card>
      </section>

      <section v-if="activePanel === 'works'" class="studio-panel works-panel">
        <div class="section-heading compact">
          <div>
              <span class="section-label">创作资产</span>
            <h2>历史生图</h2>
          </div>
          <div class="history-tools">
            <el-input v-model="historyQuery.keyword" :prefix-icon="Search" clearable placeholder="搜索提示词或模型" @keyup.enter="searchDrawHistory" />
            <el-select v-model="historyQuery.status" @change="searchDrawHistory">
              <el-option
                v-for="option in historyStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
        </div>

        <div class="works-grid">
          <article v-for="record in drawHistory" :key="record.id" class="work-item">
            <a v-if="record.generatedUrls?.length" :href="firstRecordUrl(record)" target="_blank" rel="noopener" class="work-image">
              <img
                :src="firstRecordUrl(record)"
                :alt="record.prompt"
                @load="setImageState(record.id, 'loaded')"
                @error="setImageState(record.id, 'error')"
              />
              <span v-if="imageState[record.id] !== 'loaded'" class="image-loading">
                {{ imageState[record.id] === 'error' ? '加载失败' : '加载中' }}
              </span>
            </a>
            <div v-else class="work-image empty-work">无图片</div>
            <div class="work-body">
              <div>
                <strong>{{ record.prompt }}</strong>
                <span>#{{ record.id }} · {{ record.model }} · {{ record.size || '默认尺寸' }}</span>
              </div>
              <el-tag size="small" :type="generationStatusType(record.status)" round>{{ generationStatusLabel(record.status) }}</el-tag>
            </div>
          </article>
          <p v-if="!drawHistory.length && !loading" class="empty-text">暂无历史作品</p>
        </div>
      </section>

      <section v-if="activePanel === 'recharge'" class="studio-panel recharge-panel">
        <div class="recharge-layout">
          <section>
            <div class="section-heading compact">
              <div>
                <span class="section-label">积分充值</span>
                <h2>充值套餐</h2>
              </div>
              <p>生成订单后，联系商家收款；后台确认后积分自动到账。</p>
            </div>

            <div class="package-grid">
              <el-card v-for="pack in packages" :key="pack.id" class="package-tile" shadow="never">
                <div>
                  <h3>{{ pack.name }}</h3>
                  <p>{{ pack.description || '适合 AI 聊天、生图和作品服务' }}</p>
                </div>
                <div class="package-value">
                  <strong>{{ pack.points + pack.bonusPoints }}</strong>
                  <span>积分</span>
                </div>
                <div class="package-meta">
                  <span>基础 {{ pack.points }}</span>
                  <span v-if="pack.bonusPoints">赠送 {{ pack.bonusPoints }}</span>
                </div>
                <div class="package-footer">
                  <span>¥ {{ formatMoney(pack.priceCents) }}</span>
                  <el-button type="primary" :loading="creatingPackageId === pack.id" @click="createOrder(pack.id)">
                    {{ creatingPackageId === pack.id ? '创建中' : '生成订单' }}
                  </el-button>
                </div>
              </el-card>
            </div>
          </section>

          <el-card class="payment-guide" shadow="never">
            <span class="section-label">充值说明</span>
            <h2>当前充值链路</h2>
            <ol>
              <li>选择套餐，系统生成待支付订单。</li>
              <li>用户按商家指定方式付款并上传支付凭证。</li>
              <li>商家核对凭证后，在后台确认支付。</li>
              <li>积分事务到账，用户可在流水里查看。</li>
            </ol>
            <p>以后接微信/支付宝，只需要把支付回调接到同一套确认逻辑。</p>
          </el-card>
        </div>

        <section class="orders-section">
          <div class="section-heading compact">
            <div>
              <span class="section-label">交易记录</span>
              <h2>我的订单</h2>
            </div>
            <el-select v-model="orderStatus" class="status-select" @change="loadOrders">
              <el-option
                v-for="option in orderStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>

          <div class="order-table">
            <div class="order-head">
              <span>订单号</span>
              <span>套餐</span>
              <span>金额</span>
              <span>积分</span>
              <span>状态</span>
              <span>支付凭证</span>
              <span>操作</span>
            </div>
            <div v-for="order in orders" :key="order.id" class="order-row">
              <span>{{ order.orderNo }}</span>
              <span>{{ order.packageName }}</span>
              <span>¥ {{ formatMoney(order.amountCents) }}</span>
              <span>{{ order.totalPoints }}</span>
              <el-tag size="small" :type="orderStatusType(order.status)" round>{{ statusLabel(order.status) }}</el-tag>
              <el-link v-if="order.paymentProofUrl" :href="order.paymentProofUrl" target="_blank" type="primary">已提交</el-link>
              <span v-else class="empty-cell">待提交</span>
              <div class="order-actions">
                <label v-if="order.status === 'pending'" class="upload-proof-button">
                  {{ order.paymentProofUrl ? '替换凭证' : '上传凭证' }}
                  <input type="file" accept="image/jpeg,image/png,image/webp" @change="handleProofFileChange(order.id, $event)" />
                </label>
                <el-button v-if="order.status === 'pending'" size="small" text @click="cancelOrder(order.id)">取消</el-button>
                <el-button v-if="order.status === 'paid'" size="small" text type="warning" @click="requestRefund(order)">申请退款</el-button>
                <span v-if="order.status === 'refund_pending'" class="muted-text">等待审核</span>
                <span v-if="order.status === 'cancelled' || order.status === 'refunded'" class="empty-cell">-</span>
              </div>
            </div>
            <p v-if="!orders.length && !loading" class="empty-text">暂无订单</p>
          </div>
        </section>
      </section>
    </section>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </main>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Calendar,
  ChatDotRound,
  Coin,
  Collection,
  HomeFilled,
  MagicStick,
  Money,
  Picture,
  Plus,
  Promotion,
  Refresh,
  Search,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import {
  createSession,
  getSessionMessages,
  getSessions,
  sendSessionChatStream,
  type ChatMessageItem,
  type ChatSessionItem,
} from '@/api/ai-chat'
import { generateImage, getDrawGenerationHistory, type DrawGenerationRecord, type GenerateImageResponse } from '@/api/draw'
import {
  getPointLogs,
  getPointsCalendar,
  getPointsProfile,
  makeupSignIn,
  signIn,
  type CalendarDay,
  type PointLogItem,
  type PointsCalendar,
  type PointsProfile,
} from '@/api/points'
import {
  cancelMyRechargeOrder,
  createRechargeOrder,
  getMyRechargeOrders,
  getRechargePackages,
  requestRechargeRefund,
  submitRechargePaymentProof,
  type RechargeOrderItem,
  type RechargeOrderStatus,
  type RechargePackageItem,
} from '@/api/recharge'

type PanelKey = 'overview' | 'chat' | 'draw' | 'works' | 'recharge'
type SelectOption = { label: string; value: string }

const router = useRouter()
const activePanel = ref<PanelKey>('overview')
const loading = ref(false)
const toast = ref('')
const signingIn = ref(false)
const packages = ref<RechargePackageItem[]>([])
const orders = ref<RechargeOrderItem[]>([])
const orderStatus = ref<RechargeOrderStatus | ''>('')
const creatingPackageId = ref(0)
const pointLogs = ref<PointLogItem[]>([])
const sessions = ref<ChatSessionItem[]>([])
const currentSessionId = ref<number | null>(null)
const messages = ref<ChatMessageItem[]>([])
const chatInput = ref('')
const chatSending = ref(false)
const streamingReply = ref('')
const chatScrollRef = ref<HTMLElement>()
const drawLoading = ref(false)
const drawResult = ref<GenerateImageResponse | null>(null)
const drawHistory = ref<DrawGenerationRecord[]>([])
const imageState = reactive<Record<number, 'loading' | 'loaded' | 'error'>>({})
let drawHistoryPollTimer: ReturnType<typeof setInterval> | null = null
let drawHistoryPolling = false
const historyQuery = reactive({
  page: 1,
  pageSize: 12,
  keyword: '',
  status: '' as '' | 'pending' | 'success' | 'failed',
})
const drawForm = reactive({
  model: 'draw-image',
  prompt: '',
  size: '1:1',
  count: 1,
  resolution: '2K',
  response_format: 'url',
})
const pointsProfile = reactive<PointsProfile>({
  points: 0,
  isUnlimited: false,
  makeupSignInChances: 0,
  signedInToday: false,
  currentStreak: 0,
  todaySignInPoints: 2,
  costs: {
    drawGeneration: 2,
    aiChat: 1,
  },
})
const pointsCalendar = reactive<PointsCalendar>({
  month: '',
  points: 0,
  isUnlimited: false,
  makeupSignInChances: 0,
  currentStreak: 0,
  days: [],
})

const navItems = [
  { key: 'overview' as PanelKey, label: '创作首页', icon: HomeFilled },
  { key: 'chat' as PanelKey, label: 'AI 聊天', icon: ChatDotRound },
  { key: 'draw' as PanelKey, label: 'AI 生图', icon: MagicStick },
  { key: 'works' as PanelKey, label: '我的作品', icon: Collection },
  { key: 'recharge' as PanelKey, label: '充值订单', icon: Money },
]
const weekNames = ['一', '二', '三', '四', '五', '六', '日']
const drawSizeOptions: SelectOption[] = [
  { label: '1:1 方图', value: '1:1' },
  { label: '16:9 横图', value: '16:9' },
  { label: '9:16 竖图', value: '9:16' },
  { label: '4:3 横图', value: '4:3' },
  { label: '3:4 竖图', value: '3:4' },
]
const drawResolutionOptions: SelectOption[] = [
  { label: '2K', value: '2K' },
  { label: '4K', value: '4K' },
  { label: '默认', value: '' },
]
const historyStatusOptions: SelectOption[] = [
  { label: '全部', value: '' },
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '生成中', value: 'pending' },
]
const orderStatusOptions: SelectOption[] = [
  { label: '全部状态', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '退款审核', value: 'refund_pending' },
  { label: '已取消', value: 'cancelled' },
  { label: '已退款', value: 'refunded' },
]

const username = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('website_user') || '{}').username || '用户'
  } catch {
    return '用户'
  }
})
const panelTitle = computed(() => navItems.find((item) => item.key === activePanel.value)?.label || '工作台')
const panelDescription = computed(() => ({
  overview: '查看积分、签到与最近使用记录',
  chat: '与 AI 连续对话，整理想法与内容',
  draw: '输入描述词，生成并保存高清图片',
  works: '查找和管理已生成的图片',
  recharge: '选择积分套餐并查看充值订单',
})[activePanel.value])
const calendarLeadingBlanks = computed(() => {
  const first = pointsCalendar.days[0]?.date
  if (!first) return 0
  const weekday = new Date(`${first}T00:00:00`).getDay()
  return weekday === 0 ? 6 : weekday - 1
})
const drawResultUrls = computed(() => {
  const data = drawResult.value?.data
  if (!Array.isArray(data)) return []
  return data
    .map((item) => item?.url || item?.thumbnail_url)
    .filter((url): url is string => Boolean(url))
})
const pointsBalanceText = computed(() =>
  pointsProfile.isUnlimited ? '无限' : pointsProfile.points,
)
const costText = (value: number) => (pointsProfile.isUnlimited ? '免费' : value)

const showToast = (message: string) => {
  toast.value = message
  window.setTimeout(() => {
    if (toast.value === message) toast.value = ''
  }, 2400)
}

const formatMoney = (cents: number) => (Number(cents || 0) / 100).toFixed(2)
const formatTime = (value: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-')
const formatDate = (value: string) => (value ? new Date(value).toLocaleDateString('zh-CN') : '-')
const statusLabel = (status: RechargeOrderStatus) =>
  ({
    pending: '待支付',
    paid: '已支付',
    refund_pending: '退款审核',
    cancelled: '已取消',
    refunded: '已退款',
  })[status] || status
const generationStatusLabel = (status: string) =>
  ({
    pending: '生成中',
    success: '成功',
    failed: '失败',
  })[status] || status
const generationStatusType = (status: string) => {
  if (status === 'success') return 'success'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'info'
}
const orderStatusType = (status: RechargeOrderStatus) => {
  if (status === 'paid') return 'success'
  if (status === 'refund_pending') return 'warning'
  if (status === 'pending') return 'warning'
  return 'info'
}
const sceneLabel = (scene: string) =>
  ({
    daily_sign_in: '每日签到',
    makeup_sign_in: '补签',
    recharge: '充值到账',
    recharge_refund: '充值退款扣回',
    ai_chat: 'AI 聊天',
    draw_generation: 'AI 生图',
    draw_generation_refund: '生图失败退回',
  })[scene] || scene

const loadPoints = async () => {
  Object.assign(pointsProfile, await getPointsProfile())
}
const loadCalendar = async () => {
  Object.assign(pointsCalendar, await getPointsCalendar())
}
const loadPointLogs = async () => {
  const res = await getPointLogs({ page: 1, pageSize: 8 })
  pointLogs.value = res.list || []
}
const loadPackages = async () => {
  packages.value = await getRechargePackages()
}
const loadOrders = async () => {
  const res = await getMyRechargeOrders({
    page: 1,
    pageSize: 20,
    status: orderStatus.value || undefined,
  })
  orders.value = res.list || []
}
const loadSessions = async () => {
  sessions.value = await getSessions()
  if (!sessions.value.length) {
    const session = await createSession('新的对话')
    sessions.value = [session]
  }
  if (!currentSessionId.value) {
    currentSessionId.value = sessions.value[0]?.id || null
  }
  if (currentSessionId.value) await loadMessages(currentSessionId.value)
}
const loadMessages = async (sessionId: number) => {
  messages.value = await getSessionMessages(sessionId)
  await scrollChatToBottom()
}
const loadDrawHistory = async () => {
  const res = await getDrawGenerationHistory({
    page: historyQuery.page,
    pageSize: historyQuery.pageSize,
    keyword: historyQuery.keyword || undefined,
    status: historyQuery.status || undefined,
  }) as any
  const historyData = res?.data || res
  drawHistory.value = historyData?.list || []
}
const stopDrawHistoryPolling = () => {
  if (!drawHistoryPollTimer) return
  clearInterval(drawHistoryPollTimer)
  drawHistoryPollTimer = null
  drawHistoryPolling = false
}
const startDrawHistoryPolling = (recordId?: number) => {
  if (!recordId) return
  stopDrawHistoryPolling()
  let attempts = 0
  drawHistoryPollTimer = setInterval(async () => {
    if (drawHistoryPolling) return
    drawHistoryPolling = true
    attempts += 1
    try {
      await loadDrawHistory()
      const record = drawHistory.value.find((item) => item.id === recordId)
      if (record && record.status !== 'pending') {
        stopDrawHistoryPolling()
        showToast(record.status === 'success' ? '图片已生成并保存到历史' : record.errorMessage || '生图失败')
      } else if (attempts >= 60) {
        stopDrawHistoryPolling()
      }
    } finally {
      drawHistoryPolling = false
    }
  }, 5000)
}
const refreshAll = async () => {
  loading.value = true
  try {
    await Promise.all([
      loadPoints(),
      loadCalendar(),
      loadPointLogs(),
      loadPackages(),
      loadOrders(),
      loadSessions(),
      loadDrawHistory(),
    ])
  } catch (error: any) {
    showToast(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleSignIn = async () => {
  signingIn.value = true
  try {
    const res = await signIn()
    showToast(res.alreadySignedIn ? '今天已经签到' : `签到成功，获得 ${res.earned} 积分`)
    await Promise.all([loadPoints(), loadCalendar(), loadPointLogs()])
  } catch (error: any) {
    showToast(error.message || '签到失败')
  } finally {
    signingIn.value = false
  }
}
const canMakeup = (date: string, signedIn: boolean, isPast: boolean) => {
  return isPast && !signedIn && pointsCalendar.makeupSignInChances > 0 && !!date
}
const handleMakeup = async (date: string) => {
  try {
    const res = await makeupSignIn(date)
    showToast(`补签成功，获得 ${res.earned} 积分`)
    await Promise.all([loadPoints(), loadCalendar(), loadPointLogs()])
  } catch (error: any) {
    showToast(error.message || '补签失败')
  }
}

const handleCreateSession = async () => {
  const session = await createSession('新的对话')
  sessions.value.unshift(session)
  await selectSession(session.id)
}
const selectSession = async (sessionId: number) => {
  currentSessionId.value = sessionId
  streamingReply.value = ''
  await loadMessages(sessionId)
}
const scrollChatToBottom = async () => {
  await nextTick()
  const el = chatScrollRef.value
  if (el) el.scrollTop = el.scrollHeight
}
const handleSendMessage = async () => {
  const content = chatInput.value.trim()
  if (!content) return
  if (!currentSessionId.value) {
    const session = await createSession('新的对话')
    sessions.value.unshift(session)
    currentSessionId.value = session.id
  }

  const sessionId = currentSessionId.value
  chatSending.value = true
  streamingReply.value = ''
  chatInput.value = ''
  messages.value.push({
    id: Date.now(),
    sessionId,
    role: 'user',
    content,
    createdAt: new Date().toISOString(),
  })
  await scrollChatToBottom()

  try {
    for await (const event of sendSessionChatStream(sessionId, content)) {
      if (event.type === 'content' && event.content) {
        streamingReply.value += event.content
        await scrollChatToBottom()
      }
    }
    await Promise.all([loadMessages(sessionId), loadSessions(), loadPoints(), loadPointLogs()])
  } catch (error: any) {
    showToast(error.message || 'AI 聊天失败')
    await Promise.all([loadMessages(sessionId), loadPoints(), loadPointLogs()])
  } finally {
    chatSending.value = false
    streamingReply.value = ''
  }
}

const handleGenerate = async () => {
  const prompt = drawForm.prompt.trim()
  if (!prompt) return
  drawLoading.value = true
  drawResult.value = null
  try {
    drawResult.value = await generateImage({
      model: drawForm.model || 'draw-image',
      prompt,
      image: [],
      size: drawForm.size,
      count: drawForm.count,
      resolution: drawForm.resolution || undefined,
      response_format: drawForm.response_format,
    })
    showToast(drawResultUrls.value.length ? '生图完成，已保存到历史作品' : '任务已提交，图片生成中，请稍后刷新历史')
    await Promise.all([loadDrawHistory(), loadPoints(), loadPointLogs()])
    if (!drawResultUrls.value.length) {
      startDrawHistoryPolling(drawResult.value?.id)
    }
  } catch (error: any) {
    showToast(error.message || '生图失败')
    await Promise.all([loadPoints(), loadPointLogs()])
  } finally {
    drawLoading.value = false
  }
}
const searchDrawHistory = async () => {
  historyQuery.page = 1
  await loadDrawHistory()
}
const firstRecordUrl = (record: DrawGenerationRecord) => (record.generatedUrls || [])[0] || ''
const setImageState = (id: number, state: 'loaded' | 'error') => {
  imageState[id] = state
}

const createOrder = async (packageId: number) => {
  creatingPackageId.value = packageId
  try {
    await createRechargeOrder(packageId)
    showToast('订单已创建，请付款后上传支付凭证')
    await loadOrders()
  } catch (error: any) {
    showToast(error.message || '创建订单失败')
  } finally {
    creatingPackageId.value = 0
  }
}
const cancelOrder = async (id: number) => {
  try {
    await cancelMyRechargeOrder(id)
    showToast('订单已取消')
    await loadOrders()
  } catch (error: any) {
    showToast(error.message || '取消失败')
  }
}
const handleProofFileChange = async (id: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await submitRechargePaymentProof(id, file)
    showToast('支付凭证已提交，等待商家核对')
    await loadOrders()
  } catch (error: any) {
    showToast(error.message || '支付凭证上传失败')
  } finally {
    input.value = ''
  }
}
const requestRefund = async (order: RechargeOrderItem) => {
  try {
    const result = await ElMessageBox.prompt(
      `申请订单 ${order.orderNo} 退款，请说明原因。审核通过后将扣回 ${order.totalPoints} 积分。`,
      '申请退款',
      {
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入退款原因',
        inputValidator: (value) => value.trim().length >= 2 || '退款原因至少 2 个字',
      },
    )
    await requestRechargeRefund(order.id, result.value.trim())
    showToast('退款申请已提交')
    await loadOrders()
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') return
    showToast(error.message || '退款申请提交失败')
  }
}
const logout = () => {
  localStorage.removeItem('website_token')
  localStorage.removeItem('website_user')
  router.push('/')
}

onMounted(refreshAll)
onUnmounted(stopDrawHistoryPolling)
</script>

<style scoped src="../styles/user-app.css"></style>
