<template>
  <div class="games-page">
    <div class="page-header games-header">
      <div class="page-title-block">
        <div class="page-kicker">Game Lab</div>
        <h2>小游戏</h2>
        <p class="page-description">
          先放纯前端小游戏，不依赖后端接口；当前内置记忆翻牌，其他推荐可以继续逐个加成可玩版本。
        </p>
      </div>
      <div class="header-stats">
        <div class="stat-card">
          <span class="stat-label">推荐</span>
          <strong>{{ gameIdeas.length }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-label">已上线</span>
          <strong>1</strong>
        </div>
      </div>
    </div>

    <section class="recommend-section">
      <div class="section-title-row">
        <div>
          <h3>推荐先做这些</h3>
          <p>都适合纯前端实现，体量小、体验直观，后续也能接排行榜和积分。</p>
        </div>
      </div>

      <div class="idea-grid">
        <article v-for="idea in gameIdeas" :key="idea.name" class="idea-card">
          <div class="idea-icon">
            <el-icon><component :is="idea.icon" /></el-icon>
          </div>
          <div class="idea-content">
            <div class="idea-top">
              <h4>{{ idea.name }}</h4>
              <el-tag size="small" :type="idea.tagType">{{ idea.level }}</el-tag>
            </div>
            <p>{{ idea.desc }}</p>
            <div class="idea-meta">
              <span>{{ idea.duration }}</span>
              <span>{{ idea.reason }}</span>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="play-section">
      <div class="play-panel">
        <div class="play-header">
          <div>
            <span class="play-badge">Playable</span>
            <h3>记忆翻牌</h3>
            <p>翻开两张卡片，配对成功会保留；全部配对完成即通关。</p>
          </div>
          <div class="play-actions">
            <el-select v-model="difficulty" class="difficulty-select" @change="startGame">
              <el-option label="简单 4 组" value="easy" />
              <el-option label="标准 6 组" value="normal" />
              <el-option label="挑战 8 组" value="hard" />
            </el-select>
            <el-button type="primary" :icon="Refresh" @click="startGame">重开</el-button>
          </div>
        </div>

        <div class="score-row">
          <div class="score-item">
            <span>步数</span>
            <strong>{{ moves }}</strong>
          </div>
          <div class="score-item">
            <span>用时</span>
            <strong>{{ elapsedSeconds }}s</strong>
          </div>
          <div class="score-item">
            <span>进度</span>
            <strong>{{ matchedPairs }}/{{ pairCount }}</strong>
          </div>
        </div>

        <div class="memory-board" :class="`memory-board-${difficulty}`">
          <button
            v-for="card in cards"
            :key="card.uid"
            type="button"
            class="memory-card"
            :class="{ flipped: card.flipped || card.matched, matched: card.matched }"
            :disabled="card.flipped || card.matched || lockBoard"
            @click="flipCard(card.uid)"
          >
            <span class="card-front">{{ card.value }}</span>
            <span class="card-back">
              <el-icon><StarFilled /></el-icon>
            </span>
          </button>
        </div>

        <el-alert
          v-if="finished"
          class="finish-alert"
          type="success"
          :closable="false"
          show-icon
          :title="`通关完成：${moves} 步，用时 ${elapsedSeconds} 秒`"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  Aim,
  Cpu,
  Grid,
  MagicStick,
  Pointer,
  Promotion,
  Refresh,
  StarFilled,
  Timer,
  Trophy,
} from '@element-plus/icons-vue'

type Difficulty = 'easy' | 'normal' | 'hard'

interface MemoryCard {
  uid: string
  value: string
  flipped: boolean
  matched: boolean
}

const gameIdeas = [
  {
    name: '记忆翻牌',
    level: '已上线',
    tagType: 'success',
    desc: '点击翻牌找相同图案，适合先做成排行榜和每日挑战。',
    duration: '1-3 分钟',
    reason: '规则简单',
    icon: Grid,
  },
  {
    name: '2048',
    level: '推荐',
    tagType: 'warning',
    desc: '键盘或滑动合并数字，纯前端逻辑完整，留存感比较强。',
    duration: '3-8 分钟',
    reason: '可反复玩',
    icon: Trophy,
  },
  {
    name: '贪吃蛇',
    level: '推荐',
    tagType: 'warning',
    desc: 'Canvas 或 CSS 网格都能做，适合加速度、障碍和皮肤。',
    duration: '2-5 分钟',
    reason: '动作反馈强',
    icon: Aim,
  },
  {
    name: '扫雷',
    level: '进阶',
    tagType: 'info',
    desc: '随机布雷、递归展开、旗帜标记都在前端完成。',
    duration: '5-10 分钟',
    reason: '策略性好',
    icon: Pointer,
  },
  {
    name: '反应测速',
    level: '轻量',
    tagType: 'success',
    desc: '等待信号后点击，统计反应时间，适合做每日最好成绩。',
    duration: '30 秒',
    reason: '实现快',
    icon: Timer,
  },
  {
    name: '打字挑战',
    level: '轻量',
    tagType: 'success',
    desc: '随机句子限时输入，统计速度和准确率，可以复用文章/词库。',
    duration: '1 分钟',
    reason: '数据好展示',
    icon: MagicStick,
  },
  {
    name: 'AI 猜词',
    level: '后续',
    tagType: 'info',
    desc: '先纯前端词库版，之后可以接 AI 生成题目和提示。',
    duration: '2-4 分钟',
    reason: '可接 AI',
    icon: Cpu,
  },
  {
    name: '每日抽卡',
    level: '后续',
    tagType: 'info',
    desc: '纯前端先做动画和概率，之后再接积分消耗和记录。',
    duration: '10 秒',
    reason: '适合活动',
    icon: Promotion,
  },
] as const

const symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const difficulty = ref<Difficulty>('normal')
const cards = ref<MemoryCard[]>([])
const moves = ref(0)
const elapsedSeconds = ref(0)
const started = ref(false)
const finished = ref(false)
const lockBoard = ref(false)
const openedIds = ref<string[]>([])
let timer: number | undefined

const pairCountMap: Record<Difficulty, number> = {
  easy: 4,
  normal: 6,
  hard: 8,
}

const pairCount = computed(() => pairCountMap[difficulty.value])
const matchedPairs = computed(() => cards.value.filter((card) => card.matched).length / 2)

const shuffle = <T,>(list: T[]) => {
  const next = [...list]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = next[index]!
    next[index] = next[randomIndex]!
    next[randomIndex] = current
  }
  return next
}

const stopTimer = () => {
  if (timer) {
    window.clearInterval(timer)
    timer = undefined
  }
}

const startTimer = () => {
  if (started.value) return
  started.value = true
  timer = window.setInterval(() => {
    elapsedSeconds.value += 1
  }, 1000)
}

const startGame = () => {
  stopTimer()
  moves.value = 0
  elapsedSeconds.value = 0
  started.value = false
  finished.value = false
  lockBoard.value = false
  openedIds.value = []

  const values = symbols.slice(0, pairCount.value)
  cards.value = shuffle([...values, ...values]).map((value, index) => ({
    uid: `${value}-${index}-${Date.now()}`,
    value,
    flipped: false,
    matched: false,
  }))
}

const flipCard = (uid: string) => {
  if (lockBoard.value || finished.value) return
  const card = cards.value.find((item) => item.uid === uid)
  if (!card || card.flipped || card.matched) return

  startTimer()
  card.flipped = true
  openedIds.value.push(uid)

  if (openedIds.value.length < 2) return

  moves.value += 1
  const [firstId, secondId] = openedIds.value
  const first = cards.value.find((item) => item.uid === firstId)
  const second = cards.value.find((item) => item.uid === secondId)

  if (!first || !second) {
    openedIds.value = []
    return
  }

  if (first.value === second.value) {
    first.matched = true
    second.matched = true
    openedIds.value = []
    checkFinished()
    return
  }

  lockBoard.value = true
  window.setTimeout(() => {
    first.flipped = false
    second.flipped = false
    openedIds.value = []
    lockBoard.value = false
  }, 680)
}

const checkFinished = () => {
  if (!cards.value.length || cards.value.some((card) => !card.matched)) return
  finished.value = true
  stopTimer()
}

onMounted(startGame)
onBeforeUnmount(stopTimer)
</script>

<style scoped>
.games-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.games-header {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 255, 0.94));
  border: 1px solid rgba(122, 160, 211, 0.16);
  box-shadow: 0 18px 42px rgba(95, 124, 170, 0.12);
}

.page-title-block {
  min-width: 0;
}

.page-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.games-header h2 {
  margin: 0;
  color: #243755;
  font-size: 30px;
  font-weight: 700;
}

.page-description {
  margin: 10px 0 0;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.7;
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

.stat-card {
  width: 112px;
  min-height: 86px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 16px;
  border-radius: 18px;
  background: #fff;
  border: 1px solid rgba(122, 160, 211, 0.14);
}

.stat-label {
  color: #8ca0bc;
  font-size: 12px;
}

.stat-card strong {
  margin-top: 8px;
  color: #243755;
  font-size: 28px;
  line-height: 1;
}

.recommend-section,
.play-panel {
  padding: 22px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(122, 160, 211, 0.14);
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.1);
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title-row h3,
.play-header h3 {
  margin: 0;
  color: #243755;
  font-size: 18px;
}

.section-title-row p,
.play-header p {
  margin: 6px 0 0;
  color: #7d90af;
  font-size: 13px;
  line-height: 1.6;
}

.idea-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.idea-card {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 16px;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.idea-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  color: #2f69d0;
  background: rgba(47, 145, 255, 0.1);
  font-size: 20px;
}

.idea-content {
  min-width: 0;
}

.idea-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.idea-top h4 {
  margin: 0;
  color: #243755;
  font-size: 15px;
}

.idea-content p {
  margin: 8px 0 10px;
  color: #5d7395;
  font-size: 13px;
  line-height: 1.6;
}

.idea-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: #8ca0bc;
  font-size: 12px;
}

.play-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.play-badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  margin-bottom: 10px;
  border-radius: 999px;
  background: rgba(45, 207, 159, 0.1);
  color: #159a78;
  font-size: 12px;
  font-weight: 700;
}

.play-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.difficulty-select {
  width: 132px;
}

.score-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.score-item {
  padding: 14px 16px;
  border-radius: 14px;
  background: #f7faff;
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.score-item span {
  display: block;
  color: #8ca0bc;
  font-size: 12px;
}

.score-item strong {
  display: block;
  margin-top: 6px;
  color: #243755;
  font-size: 24px;
  line-height: 1;
}

.memory-board {
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.memory-board-easy {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.memory-board-normal,
.memory-board-hard {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.memory-card {
  position: relative;
  aspect-ratio: 1;
  min-height: 86px;
  border: 1px solid rgba(122, 160, 211, 0.18);
  border-radius: 16px;
  background: transparent;
  cursor: pointer;
  transform-style: preserve-3d;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
  box-shadow: 0 10px 22px rgba(95, 124, 170, 0.1);
}

.memory-card:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 26px rgba(95, 124, 170, 0.14);
}

.memory-card.flipped,
.memory-card.matched {
  transform: rotateY(180deg);
}

.memory-card.matched {
  border-color: rgba(45, 207, 159, 0.34);
}

.card-front,
.card-back {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: inherit;
  backface-visibility: hidden;
}

.card-front {
  background: linear-gradient(135deg, #2f91ff 0%, #2dcf9f 100%);
  color: #fff;
  font-size: 34px;
  font-weight: 800;
  transform: rotateY(180deg);
}

.card-back {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 246, 255, 0.98));
  color: #7c4dff;
  font-size: 26px;
}

.finish-alert {
  margin-top: 16px;
}

@media (max-width: 900px) {
  .games-header,
  .play-header {
    flex-direction: column;
  }

  .header-stats,
  .play-actions {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .games-header,
  .recommend-section,
  .play-panel {
    padding: 18px;
  }

  .header-stats,
  .score-row {
    grid-template-columns: 1fr;
    display: grid;
  }

  .stat-card {
    width: 100%;
  }

  .memory-board,
  .memory-board-easy,
  .memory-board-normal,
  .memory-board-hard {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .memory-card {
    min-height: 74px;
  }
}
</style>
